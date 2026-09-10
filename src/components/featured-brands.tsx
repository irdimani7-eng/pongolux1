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
 * Below `lg` (phones, tablets, narrow browser windows) there's no
 * realistic way to fit 9 cards without either scrolling or making them
 * unreadably tiny, so this renders a fixed-size horizontally-scrollable
 * row there (MOBILE_CARD_CLASSES) — same as before.
 *
 * At `lg` and up, a second, fluid layout takes over (DESKTOP_CARD_CLASSES):
 * each card uses `flex-[grow_1_0%]` with a `min-w`/`max-w` clamp instead of
 * a fixed width, so the row always fills the container's exact width — no
 * scrollbar, at ANY viewport ≥1024px, not just one specific breakpoint like
 * the earlier `xl:`-only attempt. Verified with Playwright screenshots at
 * 1024–1920px (zero overflow at every width) before shipping. */
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

type Size = (typeof FEATURED_BRANDS)[number]["size"];

const MOBILE_CARD_CLASSES: Record<Size, string> = {
  featured:
    "relative flex h-32 w-44 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-accent bg-surface px-4 text-center shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:h-40 sm:w-56",
  medium:
    "flex h-28 w-40 shrink-0 flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface px-4 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg sm:w-44",
  small:
    "flex h-24 w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-3 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg sm:h-28 sm:w-36",
};

const DESKTOP_CARD_CLASSES: Record<Size, string> = {
  featured:
    "relative flex h-40 flex-[2.4_1_0%] min-w-[160px] max-w-[224px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-accent bg-surface px-4 text-center shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl",
  medium:
    "flex h-28 flex-[1.6_1_0%] min-w-[120px] max-w-[160px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface px-4 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg",
  small:
    "flex h-20 flex-[1_1_0%] min-w-[64px] max-w-[96px] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-3 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg",
};

const NAME_CLASSES: Record<Size, string> = {
  featured: "font-(family-name:--font-display) text-xl sm:text-2xl",
  medium: "font-(family-name:--font-display) text-lg",
  small: "font-(family-name:--font-display) text-sm sm:text-base",
};

const UNDERLINE_CLASSES: Record<Size, string> = {
  featured: "h-px w-10 bg-accent",
  medium: "h-px w-8 bg-accent/50",
  small: "h-px w-6 bg-accent/50",
};

function BrandCard({
  name,
  size,
  cardClasses,
}: {
  name: string;
  size: Size;
  cardClasses: Record<Size, string>;
}) {
  return (
    <Link
      href={`/shop?brand=${encodeURIComponent(name)}`}
      className={cardClasses[size]}
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
  );
}

export function FeaturedBrands() {
  return (
    <>
      {/* Mobile / tablet: fixed-size cards, horizontal scroll */}
      <div className="flex items-end justify-center gap-4 overflow-x-auto px-1 pb-2 sm:gap-6 lg:hidden">
        {FEATURED_BRANDS.map(({ name, size }) => (
          <BrandCard
            key={name}
            name={name}
            size={size}
            cardClasses={MOBILE_CARD_CLASSES}
          />
        ))}
      </div>

      {/* Desktop (lg+): fluid layout, fills the row exactly, no scrollbar
       * at any width from 1024px up. */}
      <div className="hidden items-end justify-center gap-3 px-1 pb-2 lg:flex">
        {FEATURED_BRANDS.map(({ name, size }) => (
          <BrandCard
            key={name}
            name={name}
            size={size}
            cardClasses={DESKTOP_CARD_CLASSES}
          />
        ))}
      </div>
    </>
  );
}
