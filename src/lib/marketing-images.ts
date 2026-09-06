/**
 * Editorial / lifestyle photography used for hero banners and section
 * imagery across the site (homepage, shop, etc.) — inspired by the
 * full-bleed lifestyle photography style used by TheRealReal and Rebag.
 *
 * These are NOT product photos (real inventory photos live in
 * public/products/<sku>/ and come from scripts/import-products.ts). These
 * are free-to-use stock photography from Unsplash, chosen to set an
 * aspirational tone without depicting any specific real item for sale.
 *
 * Unsplash photos are free for commercial and noncommercial use without
 * permission (the Unsplash License) — attribution isn't required but is
 * good practice, so photographer credit is kept here for reference.
 * Swap any of these for real PongoLux photography (a photoshoot, or
 * lifestyle shots of your own bags) any time — just replace the `src`.
 *
 * All URLs use Unsplash's own imgix-based resizing params (`w`, `q`,
 * `auto=format`, `fit=crop`) so each is requested at a sensible size
 * rather than full resolution.
 */

export const MARKETING_IMAGES = {
  /** Full-bleed homepage hero — editorial fashion shot. */
  homeHero: {
    src: "https://images.unsplash.com/photo-1710144012477-298aecd45d4a?w=2000&q=80&auto=format&fit=crop",
    alt: "Woman in a tailored coat carrying a designer handbag",
    credit: "Unsplash",
  },
  /** Shop page header banner. */
  shopBanner: {
    src: "https://images.unsplash.com/photo-1559127452-9328c6b697bd?w=2000&q=80&auto=format&fit=crop",
    alt: "Woman carrying a leather designer handbag",
    credit: "Unsplash",
  },
  /** Authentication section — tactile, close-up leather/craftsmanship shot. */
  authenticationDetail: {
    src: "https://images.unsplash.com/photo-1647960514922-052047430407?w=1400&q=80&auto=format&fit=crop",
    alt: "Close-up detail of fine leather material",
    credit: "Unsplash",
  },
} as const;
