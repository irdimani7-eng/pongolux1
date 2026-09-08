import Link from "next/link";

/** Auto-scrolling "Shop by brand" strip. Renders the brand list twice back
 * to back and animates the track left by exactly 50% of its width, which
 * makes the loop seamless — the second copy is `aria-hidden`/untabbable so
 * screen readers and keyboard nav only ever see the real list once. Pauses
 * on hover/focus, and skips the animation entirely under
 * prefers-reduced-motion (see the `motion-safe:` variants below). */
export function BrandMarquee({ brands }: { brands: string[] }) {
  if (brands.length === 0) return null;

  const card = (brand: string, key: string, duplicate = false) => (
    <Link
      key={key}
      href={`/shop?brand=${encodeURIComponent(brand)}`}
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}
      className="flex h-24 w-44 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-surface px-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
    >
      <span className="font-(family-name:--font-display) text-base">
        {brand}
      </span>
    </Link>
  );

  return (
    <div
      className="group relative overflow-hidden py-1"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 48px, black calc(100% - 48px), transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 48px, black calc(100% - 48px), transparent)",
      }}
    >
      <div className="flex w-max gap-4 motion-safe:animate-marquee motion-safe:group-hover:[animation-play-state:paused] motion-safe:group-focus-within:[animation-play-state:paused]">
        {brands.map((brand) => card(brand, `a-${brand}`))}
        {brands.map((brand) => card(brand, `b-${brand}`, true))}
      </div>
    </div>
  );
}
