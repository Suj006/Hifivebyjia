"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import { cn } from "@/lib/format";
import type { ProductImage as ProductImageType } from "@/types";

/**
 * Product image carousel: native swipe via scroll-snap, thumbnails, arrow
 * buttons, keyboard support and a full-screen viewer. Images are never cropped.
 */
function useSnapTrack(count: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el || !el.clientWidth) return;
    setIndex(Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / el.clientWidth))));
  }, [count]);

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const el = ref.current;
      if (!el) return;
      const target = (i + count) % count;
      el.scrollTo({ left: target * el.clientWidth, behavior: smooth ? "smooth" : "instant" });
      setIndex(target);
    },
    [count],
  );

  return { ref, index, onScroll, goTo };
}

interface GalleryProps {
  images: ProductImageType[];
  productName: string;
  badge?: React.ReactNode;
}

export function ProductGallery({ images, productName, badge }: GalleryProps) {
  const { ref: mainRef, index: mainIndex, onScroll: onMainScroll, goTo } = useSnapTrack(images.length);
  const [viewer, setViewer] = useState<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const multiple = images.length > 1;

  // Keep the active thumbnail in view.
  useEffect(() => {
    const thumb = thumbsRef.current?.children[mainIndex] as HTMLElement | undefined;
    thumb?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [mainIndex]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(mainIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(mainIndex - 1);
    }
  };

  return (
    <div className="lg:sticky lg:top-28">
      <div
        className="relative overflow-hidden rounded-[2rem] bg-pink-soft/40"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${productName} images`}
        onKeyDown={onKeyDown}
      >
        <div
          ref={mainRef}
          onScroll={onMainScroll}
          className="scrollbar-none flex aspect-square snap-x snap-mandatory overflow-x-auto scroll-smooth"
          tabIndex={0}
          aria-live="polite"
        >
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              className="relative aspect-square w-full shrink-0 snap-center snap-always cursor-zoom-in"
              onClick={() => setViewer(i)}
              aria-label={`View image ${i + 1} of ${images.length} full screen`}
              aria-hidden={i !== mainIndex}
              tabIndex={i === mainIndex ? 0 : -1}
            >
              <ProductImage
                image={img}
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>

        {badge && <div className="pointer-events-none absolute top-4 left-4">{badge}</div>}

        <button
          type="button"
          onClick={() => setViewer(mainIndex)}
          className="absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white/95 shadow-soft transition hover:scale-110"
          aria-label="Open full-screen viewer"
        >
          <Maximize2 className="h-5 w-5" aria-hidden />
        </button>

        {multiple && (
          <>
            <button
              type="button"
              onClick={() => goTo(mainIndex - 1)}
              className="absolute top-1/2 left-3 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-soft transition hover:scale-110 sm:grid"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => goTo(mainIndex + 1)}
              className="absolute top-1/2 right-3 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-soft transition hover:scale-110 sm:grid"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 sm:hidden" aria-hidden>
              {images.map((img, i) => (
                <span key={img.src} className={cn("h-2 rounded-full transition-all", i === mainIndex ? "w-6 bg-pink-deep" : "w-2 bg-ink/25")} />
              ))}
            </div>
            <span className="absolute bottom-4 left-4 hidden rounded-full bg-white/90 px-3 py-1 text-xs font-bold sm:block">
              {mainIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {multiple && (
        <div ref={thumbsRef} className="scrollbar-none mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Choose image">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              role="tab"
              aria-selected={i === mainIndex}
              aria-label={`Show image ${i + 1}: ${img.kind ?? "photo"}`}
              onClick={() => goTo(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition sm:h-20 sm:w-20",
                i === mainIndex ? "border-pink-deep shadow-pop" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <ProductImage image={img} alt="" loading="lazy" sizes="80px" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}

      {viewer !== null && (
        <Lightbox images={images} productName={productName} start={viewer} onClose={(i) => { setViewer(null); goTo(i, false); }} />
      )}
    </div>
  );
}

function Lightbox({
  images,
  productName,
  start,
  onClose,
}: {
  images: ProductImageType[];
  productName: string;
  start: number;
  onClose: (index: number) => void;
}) {
  const { ref: trackRef, index, onScroll, goTo } = useSnapTrack(images.length);
  const closeRef = useRef<HTMLButtonElement>(null);
  const indexRef = useRef(start);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    goTo(start, false);
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose(indexRef.current);
      if (e.key === "ArrowRight") goTo(indexRef.current + 1);
      if (e.key === "ArrowLeft") goTo(indexRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex animate-fade-in flex-col bg-ink/95" role="dialog" aria-modal="true" aria-label={`${productName} – full-screen images`}>
      <div className="flex items-center justify-between p-4 text-white">
        <span className="font-bold">
          {index + 1} / {images.length}
        </span>
        <button ref={closeRef} type="button" onClick={() => onClose(index)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close full-screen viewer">
          <X className="h-6 w-6" aria-hidden />
        </button>
      </div>
      <div ref={trackRef} onScroll={onScroll} className="scrollbar-none flex flex-1 snap-x snap-mandatory overflow-x-auto">
        {images.map((img, i) => (
          <div key={img.src} className="flex h-full w-full shrink-0 snap-center items-center justify-center p-4 sm:p-10" aria-hidden={i !== index}>
            <ProductImage image={img} loading="lazy" sizes="100vw" className="max-h-full w-auto max-w-full rounded-3xl object-contain" />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-4 p-4">
          <button type="button" onClick={() => goTo(index - 1)} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous image">
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
          <p className="max-w-[50vw] truncate text-center text-sm text-white/80">{images[index]?.alt}</p>
          <button type="button" onClick={() => goTo(index + 1)} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next image">
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
