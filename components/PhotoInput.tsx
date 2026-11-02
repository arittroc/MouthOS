"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/image-upload";

export function PhotoInput({ file, onChange, disabled }: {
  file: File | null; onChange: (file: File | null) => void; disabled: boolean;
}) {
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [preparing, setPreparing] = useState(false);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function select(input: HTMLInputElement) {
    const selected = input.files?.[0];
    input.value = "";
    if (!selected) return;
    setError("");
    if (!IMAGE_TYPES.includes(selected.type)) { setError("Choose JPEG, PNG, or WebP. Export HEIC photos as JPEG first."); return; }
    if (selected.size > 20 * 1024 * 1024) { setError("Choose a photo under 20 MB."); return; }
    setPreparing(true);
    const url = URL.createObjectURL(selected);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error();
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.88));
      if (!blob || blob.size > MAX_IMAGE_BYTES) throw new Error();
      onChange(new File([blob], "dental-photo.jpg", { type: "image/jpeg" }));
    } catch { setError("Could not prepare this photo. Try another JPEG, PNG, or WebP image."); }
    finally { URL.revokeObjectURL(url); setPreparing(false); }
  }
  const busy = disabled || preparing;
  return (
    <div className="relative mt-3 rounded-2xl border border-white/10 bg-ink-950/80 p-3 text-left">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy} onClick={() => gallery.current?.click()} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-500/20 px-3 text-sm text-indigo-100 disabled:opacity-50"><ImagePlus className="h-4 w-4" />Upload photo</button>
        <button type="button" disabled={busy} onClick={() => camera.current?.click()} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-slate-200 disabled:opacity-50"><Camera className="h-4 w-4" />Take photo</button>
        <span className="text-xs text-slate-400">{preparing ? "Preparing photo…" : "Photo search · optional symptoms above"}</span>
      </div>
      <input ref={gallery} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Upload dental photo from gallery" onChange={event => void select(event.currentTarget)} />
      <input ref={camera} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" aria-label="Take dental photo with camera" onChange={event => void select(event.currentTarget)} />
      {preview ? <div className="mt-3 flex items-center gap-3">
        {/* Local object URL; never fetched or persisted. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Selected dental photo for assessment" className="h-20 w-24 rounded-lg object-contain" />
        <p className="flex-1 text-xs text-slate-300">Photo attached. Select Search to assess it.</p>
        <button type="button" disabled={busy} onClick={() => onChange(null)} aria-label="Remove attached photo" className="focus-ring rounded-lg p-3 text-slate-300"><X className="h-4 w-4" /></button>
      </div> : null}
      {error ? <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p> : null}
      <p className="mt-2 text-[11px] leading-5 text-slate-500">Upload only photos you have permission to share. Photos are sent to Google Gemini for AI assessment and are not saved by MouthOS. Avoid faces and identifying details. Camera capture depends on your device.</p>
    </div>
  );
}
