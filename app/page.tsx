"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  FileText,
  Layers,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";

import { AmbientBackground } from "@/components/AmbientBackground";
import { RecordDialog } from "@/components/RecordDialog";
import { ResultCard } from "@/components/ResultCard";
import type {
  ClinicalPage,
  SearchErrorResponse,
  SearchResponse,
} from "@/lib/types";

const EXAMPLE_QUERIES = [
  "guided bone regeneration in implant dentistry",
  "erosive oral lichen planus management",
  "mandibular nerve block landmarks",
];

type Status = "idle" | "loading" | "success" | "error";

interface SearchError {
  message: string;
  code?: string;
  missing?: string[];
  details?: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<ClinicalPage[] | null>(null);
  const [meta, setMeta] = useState<SearchResponse["meta"] | null>(null);
  const [error, setError] = useState<SearchError | null>(null);
  const [selected, setSelected] = useState<ClinicalPage | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (raw: string) => {
    const value = raw.trim();
    if (value.length < 2) {
      setError({ message: "Enter at least 2 characters to search the atlas." });
      setStatus("error");
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setStatus("loading");
    setError(null);
    setSubmittedQuery(value);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: value }),
        signal: controller.signal,
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const apiError = payload as SearchErrorResponse | null;
        setResults(null);
        setMeta(null);
        setError({
          message:
            apiError?.error ??
            `The search service returned ${response.status}.`,
          code: apiError?.code,
          missing: apiError?.missing,
          details: apiError?.details,
        });
        setStatus("error");
        return;
      }

      const data = payload as SearchResponse;
      setResults(Array.isArray(data.results) ? data.results : []);
      setMeta(data.meta ?? null);
      setStatus("success");
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return;
      }
      setResults(null);
      setMeta(null);
      setError({
        message:
          "Could not reach the search service. Check your connection and try again.",
      });
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable === true;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (event.key === "/" && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeRecord = useCallback(() => setSelected(null), []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "loading") return;
    void runSearch(query);
  };

  const handleExample = (example: string) => {
    setQuery(example);
    void runSearch(example);
  };

  const loading = status === "loading";
  const hasResults = status === "success" && results !== null && results.length > 0;
  const noResults = status === "success" && results !== null && results.length === 0;

  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackground />

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-[0_8px_24px_-8px_rgba(129,140,248,0.9)]">
              <Activity
                className="h-[18px] w-[18px] text-white"
                strokeWidth={2.4}
                aria-hidden="true"
              />
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-white">
                MouthOS
              </span>
              <span className="hidden h-3 w-px bg-white/15 sm:block" />
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 sm:block">
                Clinical Atlas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-slate-400 backdrop-blur">
              <Layers className="h-3 w-3 text-indigo-300" aria-hidden="true" />
              pgvector · 768d
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-slate-400 backdrop-blur sm:inline-flex">
              <Sparkles className="h-3 w-3 text-violet-300" aria-hidden="true" />
              Gemini embeddings
            </span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl flex-1 px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-indigo-100/80 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" aria-hidden="true" />
            AI-assisted clinical retrieval
            <span className="h-1 w-1 rounded-full bg-white/25" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
              Gemini · pgvector
            </span>
          </span>

          <h1 className="mt-7 text-balance text-[clamp(2.9rem,8.5vw,4.9rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
            <span className="block bg-gradient-to-br from-white via-white to-indigo-200 bg-clip-text text-transparent">
              MouthOS
            </span>
            <span className="mt-1 block bg-gradient-to-br from-indigo-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent">
              Clinical Atlas
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-[15px] leading-7 text-slate-400 sm:text-base">
            Describe a condition, technique, or treatment in plain language.
            MouthOS embeds your question and retrieves the closest indexed pages —
            cited by chapter and page.
          </p>

          {/* ── Search ─────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit}
            role="search"
            className="group/search relative mt-10 w-full max-w-2xl"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-[3px] rounded-[26px] bg-gradient-to-r from-indigo-500/40 via-violet-500/35 to-cyan-400/30 opacity-70 blur-md transition-opacity duration-500 group-focus-within/search:opacity-100 group-hover/search:opacity-90"
            />

            <div className="relative flex items-center gap-2 rounded-[22px] border border-white/15 bg-white/[0.06] p-2 pl-4 shadow-glass backdrop-blur-xl transition-colors duration-300 focus-within:border-white/25 focus-within:bg-white/[0.09] sm:gap-3 sm:pl-5">
              <Search
                className="h-[18px] w-[18px] shrink-0 text-indigo-300/80"
                aria-hidden="true"
              />
              <label htmlFor="atlas-search" className="sr-only">
                Search the clinical atlas
              </label>
              <input
                ref={inputRef}
                id="atlas-search"
                name="query"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={400}
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. surgical management of osteonecrosis"
                className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-slate-500/80 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
              />
              <kbd className="hidden shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-500 lg:inline-block">
                ⌘K
              </kbd>
              <button
                type="submit"
                disabled={loading}
                aria-label={
                  loading
                    ? "Searching the clinical atlas"
                    : "Search the clinical atlas"
                }
                className="focus-ring inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(110deg,#6366f1_0%,#8b5cf6_45%,#22d3ee_100%)] bg-[length:200%_100%] bg-[position:0%_0%] px-4 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.9)] transition-[background-position,box-shadow,opacity] duration-500 hover:bg-[position:100%_0%] hover:shadow-[0_12px_32px_-8px_rgba(139,92,246,0.9)] disabled:cursor-progress disabled:opacity-80 sm:px-5"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {loading ? "Searching…" : "Search"}
                </span>
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Try
            </span>
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleExample(example)}
                className="focus-ring rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11.5px] text-slate-300 backdrop-blur transition duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                {example}
              </button>
            ))}
          </div>
        </section>

        {/* ── Body states ──────────────────────────────────── */}
        <div className="mt-14 w-full sm:mt-16">
          {status === "error" && error ? (
            <ErrorPanel
              error={error}
              onRetry={
                submittedQuery.length >= 2
                  ? () => void runSearch(submittedQuery)
                  : undefined
              }
            />
          ) : null}

          {loading ? <SearchSkeleton /> : null}

          {hasResults && results ? (
            <section>
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/5 pb-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-indigo-300/70">
                    Retrieval
                  </p>
                  <h2 className="mt-1.5 text-lg font-medium text-white">
                    {results.length} {results.length === 1 ? "passage" : "passages"}{" "}
                    matched
                  </h2>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    “{submittedQuery}”
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  {meta ? (
                    <>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono tabular-nums">
                        {meta.tookMs} ms
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono tabular-nums">
                        {meta.embeddingDimensions}-d
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono tabular-nums">
                        cos ≥ {meta.threshold.toFixed(2)}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 space-y-3.5">
                {results.map((result, index) => (
                  <ResultCard
                    key={`${result.id ?? result.title}-${index}`}
                    result={result}
                    index={index}
                    onOpen={setSelected}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {noResults ? (
            <div className="animate-fade-up rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center backdrop-blur-xl">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <Search className="h-5 w-5 text-indigo-300" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-lg font-medium text-white">
                No passages cleared the similarity threshold
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                Nothing in the atlas matched “{submittedQuery}” closely enough.
                Try a broader clinical phrasing, or search for a specific
                procedure, lesion, or anatomy.
              </p>
              <button
                type="button"
                onClick={() => handleExample(EXAMPLE_QUERIES[0])}
                className="focus-ring mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-[13px] font-medium text-white backdrop-blur transition hover:border-white/25 hover:bg-white/10"
              >
                Try an example query
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {status === "idle" ? <HowItWorks /> : null}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="relative mt-auto border-t border-white/5 px-5 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
            <Activity className="h-3 w-3 text-indigo-400/70" aria-hidden="true" />
            MouthOS · Clinical Atlas
          </div>
          <p className="max-w-2xl text-[11px] leading-relaxed text-slate-500/80">
            Reference material for licensed clinicians. This tool retrieves
            indexed pages — it does not provide diagnosis or treatment advice.
            Always verify against the original source.
          </p>
        </div>
      </footer>

      {selected ? (
        <RecordDialog record={selected} onClose={closeRecord} />
      ) : null}

      <p className="sr-only" role="status">
        {loading
          ? "Searching the clinical atlas"
          : hasResults
            ? `${results?.length} passages matched`
            : noResults
              ? "No passages matched"
              : ""}
      </p>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function ErrorPanel({
  error,
  onRetry,
}: {
  error: SearchError;
  onRetry?: () => void;
}) {
  return (
    <div className="animate-fade-up rounded-2xl border border-rose-400/25 bg-rose-500/[0.07] p-5 backdrop-blur-xl">
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-rose-300"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-6 text-rose-50">
            {error.message}
          </p>

          {error.missing && error.missing.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs leading-relaxed text-rose-200/70">
                Add these to your environment — locally in{" "}
                <code className="rounded bg-rose-500/10 px-1 py-0.5 font-mono text-[11px]">
                  .env.local
                </code>
                , on Vercel under Project Settings → Environment Variables:
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {error.missing.map((name) => (
                  <li
                    key={name}
                    className="rounded-md border border-rose-300/20 bg-rose-500/10 px-2 py-1 font-mono text-[11px] text-rose-100"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {error.details ? (
            <p className="mt-2 break-words font-mono text-[11px] leading-relaxed text-rose-200/45">
              {error.details}
            </p>
          ) : null}

          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="focus-ring mt-4 inline-flex items-center gap-1.5 rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-1.5 text-[12px] font-medium text-rose-100 transition hover:bg-rose-500/20"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div aria-busy="true" aria-label="Searching the clinical atlas">
      <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
        <Loader2
          className="h-3.5 w-3.5 animate-spin text-indigo-300"
          aria-hidden="true"
        />
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-indigo-300/70">
          Searching the atlas
        </p>
      </div>

      <div className="mt-6 space-y-3.5">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-20 animate-pulse rounded-md bg-white/[0.07]" />
              <div className="h-3 w-28 animate-pulse rounded bg-white/[0.05]" />
              <div className="ml-auto h-6 w-24 animate-pulse rounded-full bg-white/[0.07]" />
            </div>
            <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-white/[0.08]" />
            <div className="mt-4 space-y-2.5">
              <div className="h-3 w-full animate-pulse rounded bg-white/[0.05]" />
              <div className="h-3 w-11/12 animate-pulse rounded bg-white/[0.05]" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-white/[0.05]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Sparkles,
      label: "Embed",
      copy: "Gemini converts your question into a 768-dimensional vector.",
    },
    {
      icon: Layers,
      label: "Match",
      copy: "pgvector ranks indexed pages by cosine similarity.",
    },
    {
      icon: BookOpen,
      label: "Cite",
      copy: "Every result cites its chapter and page so you can verify the source.",
    },
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-indigo-300/60">
          How retrieval works
        </p>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <FileText className="h-3 w-3" aria-hidden="true" />
          Page-level citations
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, label, copy }) => (
          <div
            key={label}
            className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02]">
              <Icon className="h-4 w-4 text-indigo-200" aria-hidden="true" />
            </span>
            <p className="mt-4 text-[13px] font-semibold text-white">{label}</p>
            <p className="mt-1.5 text-[12.5px] leading-5 text-slate-400">
              {copy}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
