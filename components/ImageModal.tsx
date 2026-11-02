"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, ImageOff, Loader2, X } from "lucide-react";

import type { ClinicalPage } from "@/lib/types";

interface ImageModalProps {
  result: ClinicalPage;
  onClose: () => void;
}

export function ImageModal({ result, onClose }: ImageModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [imageStage, setImageStage] = useState<"jpeg" | "png" | "error">(
    result.page_number !== null && result.page_number !== undefined && result.page_number !== ""
      ? "jpeg"
      : "error",
  );
  const [imageLoading, setImageLoading] = useState(true);

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const page =
    result.page_number === null || result.page_number === undefined || result.page_number === ""
      ? "—"
      : result.page_number;

  useEffect(() => {
    if (result.page_number === null || result.page_number === undefined || result.page_number === "") {
      setImageStage("error");
      setImageLoading(false);
    } else {
      setImageStage("jpeg");
      setImageLoading(true);
    }
  }, [result.page_number]);

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

  const handleImageError = () => {
    setImageStage((current) => {
      if (current === "jpeg") {
        setImageLoading(true);
        return "png";
      }
      setImageLoading(false);
      return "error";
    });
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const imageUrl =
    imageStage !== "error" && result.page_number !== null && result.page_number !== undefined
      ? `${supabaseUrl}/storage/v1/object/public/atlas-images/page_${result.page_number}.${imageStage}`
      : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
    >
      {/* Backdrop click dismiss */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto rounded-3xl border border-white/15 bg-[#0a0818]/95 p-6 shadow-glass-lg backdrop-blur-2xl sm:p-8 animate-fade-up">
        {/* Header bar */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium tabular-nums text-slate-300">
              <FileText className="h-3 w-3 text-indigo-300" aria-hidden="true" />
              Page {page}
            </span>

            {result.chapter ? (
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-200/55">
                {result.chapter}
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

        {/* Title */}
        <h2
          id="image-modal-title"
          className="mt-3 text-xl font-semibold leading-snug tracking-[-0.015em] text-white sm:text-2xl"
        >
          {result.title}
        </h2>

        {/* Clinical Image Container */}
        <div className="relative mt-5 flex min-h-[280px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-2 shadow-inner">
          {imageStage === "error" ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-400">
                <ImageOff className="h-6 w-6 text-slate-400" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-300">
                Image not available for this page
              </p>
              <p className="mt-1 text-xs text-slate-500">
                No clinical photograph was found for Page {page}.
              </p>
            </div>
          ) : (
            <div className="relative flex max-h-[62vh] w-full items-center justify-center">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" aria-hidden="true" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={result.title || `Clinical image for page ${page}`}
                onError={handleImageError}
                onLoad={handleImageLoad}
                className={`max-h-[62vh] w-auto max-w-full rounded-xl object-contain transition-opacity duration-300 ${
                  imageLoading ? "opacity-0" : "opacity-100"
                }`}
              />
            </div>
          )}
        </div>

        {/* Optional clinical description excerpt */}
        {result.clinical_description ? (
          <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-[13.5px] leading-relaxed text-slate-300">
            <p>{result.clinical_description}</p>
          </div>
        ) : null}

        {/* Footer info */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
          <span>Source: MouthOS Clinical Atlas · Page {page}</span>
          {typeof result.similarity === "number" ? (
            <span className="font-mono tabular-nums">
              Match {(result.similarity * 100).toFixed(1)}%
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
