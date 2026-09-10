import Link from "next/link";
import { Crown } from "lucide-react";

/** A curated "Shop by brand" showcase (Irdi's pick of brands, not derived
 * from live inventory) — replaces the earlier auto-scrolling marquee,
 * which read as broken/hard to use since there was no way to scroll it
 * manually. Hermès sits in the center, visually elevated (bigger card +
 * a crown) as the flagship brand, with the other 8 brands flanking it
 * evenly (4 on each side) in consistent card styling. Expanded from the
 * original 5 to 9 brands on 2026-09-10 per Irdi's request.
 * `overflow-x-auto` keeps this order intact on narrow screens (swipe
 * instead of wrap) rather than reflowing the hierarchy — with 9 cards
 * this row is now wider than most desktop viewports too, so scrolling
 * horizontally is expected there as well, not just on mobile. */
const FEATURED_BRANDS = [
  { name: "Celine", featured: false },
  { name: "Prada", featured: false },
  { name: "Gucci", featured: false },
  { name: "Louis Vuitton", featured: false },
  { name: "Hermès", featured: true },
  { name: "Christian Dior", featured: false },
  { name: "Chanel", featured: false },
  { name: "Fendi", featured: false },
  { name: "Bottega Veneta", featured: false },
] as const;

export function FeaturedBrands() {
  return (
    <div className="flex items-end justify-center gap-4 overflow-x-auto px-1 pb-2 sm:gap-6">
      {FEATURED_BRANDS.map(({ name, featured }) => (
        <Link
          key={name}
          href={`/shop?brand=${encodeURIComponent(name)}`}
          className={
            featured
              ? "relative flex h-36 w-52 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-accent bg-surface px-4 text-center shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:h-44 sm:w-64"
              : "flex h-28 w-40 shrink-0 flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface px-4 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg sm:w-44"
          }
        >
          {featured && (
            <Crown
              className="absolute -top-4 size-7 fill-accent text-accent"
              strokeWidth={1.5}
            />
          )}
          <span
            className={
              featured
                ? "font-(family-name:--font-display) text-2xl"
                : "font-(family-name:--font-display) text-lg"
            }
          >
            {name}
          </span>
          <span
            className={featured ? "h-px w-10 bg-accent" : "h-px w-8 bg-accent/50"}
          />
        </Link>
      ))}
    </div>
  );
}
