/** A single indexed page returned by the `match_clinical_pages` RPC. */
export interface ClinicalPage {
  /** Primary key, when the RPC projects it. */
  id?: string | number;
  title: string;
  page_number: number | string | null;
  chapter: string | null;
  clinical_description: string | null;
  /** Cosine similarity in the 0–1 range. */
  similarity: number;
}

/** Successful payload returned by `POST /api/search`. */
export interface SearchResponse {
  query: string;
  results: ClinicalPage[];
  meta: {
    matchCount: number;
    threshold: number;
    embeddingDimensions: number;
    tookMs: number;
  };
}

export interface ImageAssessment {
  assessable: boolean;
  summary: string;
  findings: string[];
  possibleCauses: string[];
  nextSteps: string[];
  limitations: string;
  urgency: "emergency" | "urgent" | "routine" | "uncertain";
  searchQuery: string;
}

export interface ImageSearchResponse {
  assessment: ImageAssessment;
  retrieval: SearchResponse | null;
  retrievalWarning?: string;
}

export type SearchErrorCode =
  | "CONFIG"
  | "INVALID_QUERY"
  | "EMBEDDING_FAILED"
  | "RPC_FAILED"
  | "UNKNOWN";

/** Error payload returned by `POST /api/search`. */
export interface SearchErrorResponse {
  error: string;
  code: SearchErrorCode;
  /** Environment variable names that are missing (never their values). */
  missing?: string[];
  details?: string;
}
