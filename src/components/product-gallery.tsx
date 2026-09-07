"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type GalleryImage = { url: string; alt: string };

/**
 * The same thumbnail grid as before, but each photo now opens a full-screen
 * zoomable lightbox on click (arrow keys / on-screen arrows to move between
 * photos, Escape or a click outside the image to close).
 */
export function ProductGallery({
  images,
  fallbackAlt,
}: {
  images: GalleryImage[];
  fallbackAlt: string;
}) {
  const list = images.length > 0 ? images : [{ url: "", alt: "" }];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const showPrev = useCallback(
    () =>
      setOpenIndex((i) => (i === null ? null : (i - 1 + list.length) % list.length)),
    [list.length]
  );
  const showNext = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % list.length)),
    [list.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, showPrev, showNext]);

  const current = openIndex !== null ? list[openIndex] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        {list.map((image, i) => (
          <button
            key={i}
            type="button"
            onClick={() => image.url && setOpenIndex(i)}
            disabled={!image.url}
            className={`${
              i === 0
                ? "relative col-span-2 aspect-[4/5]"
                : "relative aspect-square"
            } overflow-hidden rounded-lg bg-muted disabled:cursor-default`}
            aria-label={image.url ? `View larger photo ${i + 1}` : undefined}
          >
            {image.url ? (
              <Image
                src={image.url}
                alt={image.alt || fallbackAlt}
                fill
                sizes="(min-width: 1024px) 45vw, 90vw"
                className="object-cover transition-transform hover:scale-[1.02]"
                priority={i === 0}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                No image yet
              </div>
            )}
          </button>
        ))}
      </div>

      {current?.url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed product photo"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 text-white/80 hover:text-white"
          >
            <X className="size-7" strokeWidth={1.5} />
          </button>

          {list.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              aria-label="Previous photo"
              className="absolute left-2 text-white/80 hover:text-white sm:left-6"
            >
              <ChevronLeft className="size-8" strokeWidth={1.5} />
            </button>
          )}

          <div
            className="relative h-[85vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current.url}
              alt={current.alt || fallbackAlt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {list.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              aria-label="Next photo"
              className="absolute right-2 text-white/80 hover:text-white sm:right-6"
            >
              <ChevronRight className="size-8" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
