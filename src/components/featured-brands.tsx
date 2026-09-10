import Link from "next/link";
import { Crown } from "lucide-react";

/** A curated "Shop by brand" showcase (Irdi's pick of brands, not derived
 * from live inventory) — replaces the earlier auto-scrolling marquee,
 * which read as broken/hard to use since there was no way to scroll it
 * manually.
 *
 * Three size tiers reflect a deliberate visual hierarchy, biggest to
 * smallest: Hermès (center, "featured") > Louis Vuitton/Christian Dior
 * ("medium", its immediate flanks) > everyone else ("small" — Gucci,
 * Fendi, plus the 4 brands added 2026-09-10: Celine, Prada, Chanel,
 * Bottega Veneta).
 *
 * `xl:` sizing is deliberately tighter than the `sm:` sizing used below
 * that breakpoint: on real desktop/laptop widths (1280px+, paired with
 * the slightly widened `max-w-7xl` wrapper in page.tsx) all 9 cards fit
 * on one row with no scrolling, which was the whole point of adding a
 * third, smaller tier. Below `xl` (phones, tablets, narrow browser
 * windows) there's no realistic way to fit 9 cards without either
 * scrolling or making them unreadably tiny, so `overflow-x-auto` keeps
 * the swipe/scroll behavior there instead of wrapping. */
const FEATURED_BRANDS = [
  { name: "Celine", size: "small" },
  { name: "Prada", size: "small" },
  { name: "Gucci", size: "small" },
  { name: "Louis Vuitton", size: "medium" },
  { name: "Hermès", size: "featured" },
  { name: "Christian Dior", size: "medium" },
  { name: "Chanel", size: "small" },
  { name: "Fendi", size: "small" },
  { name: "Bottega Veneta", size: "small" },
] as const;

const CARD_CLASSES: Record<(typeof FEATURED_BRANDS)[number]["size"], string> = {
  featured:
    "relative flex h-32 w-44 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-accent bg-surface px-4 text-center shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:h-40 sm:w-56",
  medium:
    "flex h-28 w-40 shrink-0 flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface px-4 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg sm:w-44",
  small:
    "flex h-24 w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-3 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg sm:h-28 sm:w-36 xl:h-20 xl:w-[88px]",
};

const NAME_CLASSES: Record<(typeof FEATURED_BRANDS)[number]["size"], string> = {
  featured: "font-(family-name:--font-display) text-xl sm:text-2xl",
  medium: "font-(family-name:--font-display) text-lg",
  small: "font-(family-name:--font-display) text-sm sm:text-base",
};

const UNDERLINE_CLASSES: Record<(typeof FEATURED_BRANDS)[number]["size"], string> =
  {
    featured: "h-px w-10 bg-accent",
    medium: "h-px w-8 bg-accent/50",
    small: "h-px w-6 bg-accent/50",
  };

export function FeaturedBrands() {
  return (
    <div className="flex items-end justify-center gap-4 overflow-x-auto px-1 pb-2 sm:gap-6 xl:gap-2">
      {FEATURED_BRANDS.map(({ name, size }) => (
        <Link
          key={name}
          href={`/shop?brand=${encodeURIComponent(name)}`}
          className={CARD_CLASSES[size]}
        >
          {size === "featured" && (
            <Crown
              className="absolute -top-4 size-7 fill-accent text-accent"
              strokeWidth={1.5}
            />
          )}
          <span className={NAME_CLASSES[size]}>{name}</span>
          <span className={UNDERLINE_CLASSES[size]} />
        </Link>
      ))}
    </div>
  );
}
