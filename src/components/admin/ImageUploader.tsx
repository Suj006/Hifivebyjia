"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import { cn } from "@/lib/format";
import type { ProductImage as ProductImageType } from "@/types";

const MAX_SIDE = 1600;

/** Shrinks a photo in the browser (keeps the whole picture, never crops) and returns a JPEG. */
async function resize(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can’t process this photo.");
  ctx.fillStyle = "#FFFFFF"; // transparent PNGs get a white background
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) throw new Error("Couldn’t prepare this photo.");
  return { blob, width, height };
}

interface Props {
  images: ProductImageType[];
  onChange: (images: ProductImageType[]) => void;
  productName: string;
}

export function ImageUploader({ images, onChange, productName }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const list = Array.from(files).slice(0, 12 - images.length);
    setBusy(list.length);
    const added: ProductImageType[] = [];
    for (const file of list) {
      try {
        const { blob, width, height } = await resize(file);
        const form = new FormData();
        form.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        form.append("width", String(width));
        form.append("height", String(height));
        const res = await fetch("/api/admin/images", { method: "POST", body: form });
        const data = (await res.json()) as { src?: string; width?: number; height?: number; error?: string };
        if (!res.ok || !data.src) throw new Error(data.error ?? "Upload failed.");
        added.push({ src: data.src, width: data.width ?? width, height: data.height ?? height, alt: `${productName || "Product"} – photo ${images.length + added.length + 1}` });
      } catch (e) {
        setError(`${file.name}: ${e instanceof Error ? e.message : "Upload failed."}`);
      }
      setBusy((n) => n - 1);
    }
    if (added.length) onChange([...images, ...added]);
    if (input.current) input.current.value = "";
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.src} className={cn("overflow-hidden rounded-2xl border-2 bg-white", i === 0 ? "border-pink-deep" : "border-line")}>
              <div className="relative aspect-square bg-[#FBF8FC]">
                <ProductImage image={img} alt="" sizes="200px" />
                {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-pink-deep px-2 py-0.5 text-xs font-bold text-white">Main photo</span>}
              </div>
              <div className="space-y-2 p-2">
                <label className="sr-only" htmlFor={`alt-${i}`}>
                  Photo description
                </label>
                <input
                  id={`alt-${i}`}
                  value={img.alt}
                  onChange={(e) => onChange(images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                  placeholder="Describe the photo"
                  className="w-full rounded-lg border border-line px-2 py-1 text-xs"
                />
                <div className="flex items-center justify-between gap-1">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="grid h-8 w-8 place-items-center rounded-full hover:bg-pink-soft disabled:opacity-30" aria-label="Move left">
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                  </button>
                  {i > 0 && (
                    <button type="button" onClick={() => move(i, 0)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-pink-soft" aria-label="Make main photo" title="Make main photo">
                      <Star className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} className="grid h-8 w-8 place-items-center rounded-full hover:bg-pink-soft disabled:opacity-30" aria-label="Move right">
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(images.filter((_, j) => j !== i))}
                    className="grid h-8 w-8 place-items-center rounded-full text-pink-deep hover:bg-pink-soft"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/*" multiple className="sr-only" id="photo-upload" onChange={(e) => upload(e.target.files)} />
        <label
          htmlFor="photo-upload"
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-pink/50 bg-pink-soft/30 px-4 py-6 text-center hover:bg-pink-soft/60",
            (busy > 0 || images.length >= 12) && "pointer-events-none opacity-60",
          )}
        >
          <ImagePlus className="h-8 w-8 text-pink-deep" aria-hidden />
          <span className="mt-2 font-bold">{busy > 0 ? `Uploading ${busy} photo${busy > 1 ? "s" : ""}…` : "Add photos"}</span>
          <span className="text-xs text-ink-soft">JPG or PNG from your phone or computer · up to 12 · the first photo is the main one</span>
        </label>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
