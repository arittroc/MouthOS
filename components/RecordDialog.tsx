"use client";

import { useEffect, useRef } from "react";
import { FileText, Layers, X } from "lucide-react";

import { formatSimilarity } from "@/components/ResultCard";
import type { ClinicalPage } from "@/lib/types";

interface RecordDialogProps {
  record: ClinicalPage;
  onClose: () => void;
}

export function RecordDialog({ record, onClose }: RecordDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const percent = formatSimilarity(record.similarity);
  const paragraphs =
    record.clinical_description?.split(/\n{2,}/).filter(Boolean) ?? [];
  const page =
    record.page_number === null || record.page_number === ""
      ? "—"
      : record.page_number;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-title"
    >
      <button
        type="button"
        aria-label="Close record"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink-950/75 backdrop-blur-sm"
      />

      <div className="relative z-10 max-h-[88vh] w-full max-w-2xl animate-fade-up overflow-y-auto rounded-t-3xl border border-white/15 bg-[#0a0818]/95 p-6 shadow-glass-lg backdrop-blur-2xl sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] font-medium tabular-nums text-slate-300">
              <FileText
                className="h-3 w-3 text-indigo-300"
                aria-hidden="true"
              />
              Page {page}
            </span>
            {record.chapter ? (
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-200/55">
                {record.chapter}
              </span>
            ) : null}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring -mr-1 -mt-1 rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-400 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <h2
          id="record-title"
          className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.02em] text-white sm:text-3xl"
        >
          {record.title}
        </h2>

        <div className="mt-5 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium tabular-nums text-indigo-100">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            Match {percent}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300"
              style={{ width: `${Math.max(record.similarity * 100, 2)}%` }}
            />
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          {paragraphs.length > 0 ? (
            <div className="space-y-4 text-[14px] leading-7 text-slate-300">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-slate-500">
              This page has no indexed clinical description.
            </p>
          )}
        </div>

        <p className="mt-8 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-[11px] leading-relaxed text-slate-500">
          Source: MouthOS Clinical Atlas · page {page}. Reference material only —
          verify against the original text before making clinical decisions.
        </p>
      </div>
    </div>
  );
}
