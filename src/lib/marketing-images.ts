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
  /** Authentication section — a woman closely examining a handbag. */
  authenticationDetail: {
    src: "https://images.unsplash.com/photo-1729285396771-516d25f79374?w=1400&q=80&auto=format&fit=crop",
    alt: "A woman closely examining a handbag on a table",
    credit: "Unsplash",
  },
  /** /shop/price-drops header banner. */
  priceDropsBanner: {
    src: "https://images.unsplash.com/photo-1589363460779-cd717d2ed8fa?w=2000&q=80&auto=format&fit=crop",
    alt: "A minimalist leather sling bag",
    credit: "Unsplash",
  },
  /** /shop/most-wanted header banner. */
  mostWantedBanner: {
    src: "https://images.unsplash.com/photo-1575202332411-b01fe9ace7a8?w=2000&q=80&auto=format&fit=crop",
    alt: "A leather handbag styled with eyeglasses and books",
    credit: "Unsplash",
  },
} as const;
