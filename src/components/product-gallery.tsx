"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type GalleryImage = { url: string; alt: string };

function pointFromEvent(e: MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100,
  };
}

/** The lightbox's photo, with click-to-zoom for inspecting details like
 * hardware/stitching that "fit to screen" alone doesn't show clearly.
 * `origin` is the click point as a % of the image box, used as the CSS
 * transform-origin so zooming in centers on where you clicked
 * (approximate under letterboxing from object-contain, but close enough
 * for a resale-authenticity inspection, not pixel-perfect measurement).
 * Rendered with `key={index}` by the parent so navigating to a different
 * photo remounts this component and its zoom state resets for free —
 * no effect needed to sync it back to "not zoomed". */
function ZoomableImage({ url, alt }: { url: string; alt: string }) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  return (
    <>
      <div
        className="relative h-[85vh] w-full max-w-4xl overflow-hidden"
        onClick={(e) => {
          e.stopPropagation();
          setOrigin(pointFromEvent(e));
          setZoomed((z) => !z);
        }}
        onMouseMove={(e) => {
          if (zoomed) setOrigin(pointFromEvent(e));
        }}
        style={{ cursor: zoomed ? "zoom-out" : "zoom-in" }}
      >
        <Image
          src={url}
          alt={alt}
          fill
          sizes="100vw"
          className="object-contain transition-transform duration-200 ease-out"
          style={{
            transform: zoomed ? "scale(2.2)" : "scale(1)",
            transformOrigin: `${origin.x}% ${origin.y}%`,
          }}
        />
      </div>
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60">
        {zoomed ? "Click to zoom out" : "Click photo to zoom in"}
      </p>
    </>
  );
}

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

          <ZoomableImage
            key={openIndex}
            url={current.url}
            alt={current.alt || fallbackAlt}
          />

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
