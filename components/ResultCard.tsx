"use client";

import { ArrowUpRight, FileText } from "lucide-react";

import type { ClinicalPage } from "@/lib/types";

export function formatSimilarity(value: number) {
  const safe = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return `${(safe * 100).toFixed(1)}%`;
}

function scoreClasses(value: number) {
  if (value >= 0.85) {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  }
  if (value >= 0.7) {
    return "border-indigo-400/25 bg-indigo-400/10 text-indigo-200";
  }
  return "border-white/15 bg-white/[0.06] text-slate-300";
}

interface ResultCardProps {
  result: ClinicalPage;
  index: number;
  onOpen: (result: ClinicalPage) => void;
}

export function ResultCard({ result, index, onOpen }: ResultCardProps) {
  const page =
    result.page_number === null || result.page_number === ""
      ? "—"
      : result.page_number;
  const percent = formatSimilarity(result.similarity);

  return (
    <article
      onClick={() => onOpen(result)}
      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-xl transition-all duration-300 ease-out animate-fade-up hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-glass focus-within:border-white/20 focus-within:bg-white/[0.07] sm:p-6"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      {/* Hover gradient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.16] via-violet-500/[0.06] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      {/* Top edge highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] font-medium tabular-nums text-slate-300">
            <FileText className="h-3 w-3 text-indigo-300" aria-hidden="true" />
            Page {page}
          </span>

          {result.chapter ? (
            <span className="line-clamp-1 text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-200/55">
              {result.chapter}
            </span>
          ) : null}

          <span
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tabular-nums ${scoreClasses(
              result.similarity,
            )}`}
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-current"
            />
            Match {percent}
          </span>
        </div>

        <h3 className="mt-3.5 text-lg font-semibold leading-snug tracking-[-0.01em] text-white sm:text-xl">
          {result.title}
        </h3>

        {result.clinical_description ? (
          <p className="mt-2 line-clamp-3 text-[13.5px] leading-6 text-slate-400 transition-colors duration-300 group-hover:text-slate-300">
            {result.clinical_description}
          </p>
        ) : (
          <p className="mt-2 text-[13.5px] italic leading-6 text-slate-500">
            No clinical description was indexed for this page.
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div
              className="h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-white/10"
              role="img"
              aria-label={`Cosine similarity ${percent}`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.max(result.similarity * 100, 2)}%`,
                }}
              />
            </div>
            <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-wider text-slate-500 sm:inline">
              cosine
            </span>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(result);
            }}
            className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-lg text-[12px] font-medium text-indigo-200/80 transition-all duration-300 hover:text-white group-hover:text-indigo-100 sm:translate-x-1 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-x-0 sm:group-focus-within:opacity-100"
          >
            View Full Record
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </article>
  );
}
