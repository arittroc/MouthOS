import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

import type {
  ClinicalPage,
  SearchErrorCode,
  SearchResponse,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Must match the dimension of the `vector(...)` column in Supabase. */
const EMBEDDING_DIMENSIONS = 3072;
/**
 * `text-embedding-004` was shut down by Google on 2026-01-14. The default is
 * its current successor, truncated to 768 dims to fit the pgvector column.
 * Override with GEMINI_EMBEDDING_MODEL when your index used another model.
 */
const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";
const DEFAULT_MATCH_THRESHOLD = 0.5;
const DEFAULT_MATCH_COUNT = 5;
const MAX_QUERY_LENGTH = 400;

type ApiError = {
  error: string;
  code: SearchErrorCode;
  missing?: string[];
  details?: string;
};

function fail(
  status: number,
  code: SearchErrorCode,
  error: string,
  extra: Omit<ApiError, "error" | "code"> = {},
) {
  return NextResponse.json<ApiError>(
    { error, code, ...extra },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function readRequiredEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    supabaseServiceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() ?? "",
  };
}

function toNumber(value: unknown, fallback: number) {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function readString(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function readNumber(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

/**
 * The RPC is expected to project `title`, `page_number`, `chapter`,
 * `clinical_description` and `similarity`. A few common aliases are accepted so
 * the UI keeps working if the SQL function is adjusted later.
 */
function normalizeRow(raw: unknown, index: number): ClinicalPage | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const description = readString(
    row,
    "clinical_description",
    "description",
    "content",
    "text",
  );
  const title =
    readString(row, "title", "heading", "section_title") ??
    (description ? description.slice(0, 80) : null);

  if (!title && !description) return null;

  const pageNumber =
    readNumber(row, "page_number", "page", "pageNumber") ??
    readString(row, "page_number", "page");
  const similarity = clamp(
    readNumber(row, "similarity", "similarity_score", "score") ?? 0,
    0,
    1,
  );
  const id = row.id;

  return {
    id:
      typeof id === "string" || typeof id === "number"
        ? id
        : `result-${index}`,
    title: title ?? "Untitled clinical page",
    page_number: pageNumber,
    chapter: readString(row, "chapter", "section", "book"),
    clinical_description: description,
    similarity,
  };
}

function describeError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "INVALID_QUERY", "Request body must be valid JSON.");
  }

  const rawQuery =
    body && typeof body === "object" && "query" in body
      ? (body as { query?: unknown }).query
      : undefined;

  if (typeof rawQuery !== "string") {
    return fail(400, "INVALID_QUERY", "A `query` string is required.");
  }

  const query = rawQuery.trim().replace(/\s+/g, " ");

  if (query.length < 2) {
    return fail(
      400,
      "INVALID_QUERY",
      "Enter at least 2 characters to search the atlas.",
    );
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return fail(
      400,
      "INVALID_QUERY",
      `Queries must be ${MAX_QUERY_LENGTH} characters or fewer.`,
    );
  }

  const { supabaseUrl, supabaseServiceRoleKey, geminiApiKey } =
    readRequiredEnv();
  const missing = [
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !supabaseServiceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
    !geminiApiKey && "GEMINI_API_KEY",
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0) {
    return fail(
      503,
      "CONFIG",
      "The search backend is missing required environment variables.",
      { missing },
    );
  }

  const embeddingModel =
    process.env.GEMINI_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
  const matchThreshold = clamp(
    toNumber(process.env.MATCH_THRESHOLD, DEFAULT_MATCH_THRESHOLD),
    0,
    1,
  );
  const matchCount = Math.round(
    clamp(toNumber(process.env.MATCH_COUNT, DEFAULT_MATCH_COUNT), 1, 20),
  );

  // 1. Embed the query with Gemini.
  let embedding: number[];
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.embedContent({
      model: embeddingModel,
      contents: query,
      // `gemini-embedding-001` returns 3072 dims by default and must be
      // truncated to the pgvector column width. `text-embedding-004` is
      // natively 768 and rejects the flag if it is ever restored.
      config: embeddingModel.includes("text-embedding-004")
        ? undefined
        : { outputDimensionality: EMBEDDING_DIMENSIONS },
    });

    const values = response.embeddings?.[0]?.values;
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("Gemini returned an empty embedding.");
    }
    if (values.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Expected a ${EMBEDDING_DIMENSIONS}-dimensional embedding but received ${values.length}. ` +
        `Make sure the embedding model matches the vector column in Supabase.`,
      );
    }
    embedding = values;
  } catch (error) {
    console.error("[search] embedding failed:", error);
    return fail(
      502,
      "EMBEDDING_FAILED",
      "Could not generate an embedding for this query. Please try again.",
      { details: describeError(error) },
    );
  }

  // 2. Query pgvector through the service-role client (bypasses RLS).
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.rpc("match_clinical_pages", {
      query_embedding: embedding,
      match_threshold: 0.0, // Hardcoded to 0.0 for debugging
      match_count: matchCount,
    });

    if (error) {
      console.error("[search] RPC failed:", error);
      return fail(
        500,
        "RPC_FAILED",
        "The atlas database could not be queried.",
        {
          details: [error.message, error.hint, error.details]
            .filter(Boolean)
            .join(" — "),
        },
      );
    }

    const rows = Array.isArray(data) ? data : [];
    const results = rows
      .map((row, index) => normalizeRow(row, index))
      .filter((row): row is ClinicalPage => row !== null)
      .sort((a, b) => b.similarity - a.similarity);

    const payload: SearchResponse = {
      query,
      results,
      meta: {
        matchCount: results.length,
        threshold: matchThreshold,
        embeddingDimensions: EMBEDDING_DIMENSIONS,
        tookMs: Date.now() - startedAt,
      },
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[search] unexpected failure:", error);
    return fail(
      500,
      "UNKNOWN",
      "Something went wrong while searching the atlas.",
      { details: describeError(error) },
    );
  }
}

export async function GET() {
  return fail(405, "UNKNOWN", "Use POST to search the clinical atlas.");
}
