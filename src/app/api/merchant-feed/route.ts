import { NextResponse } from "next/server";
import { getMerchantFeedProducts } from "@/lib/products";

// Always hit the database fresh — this route exists specifically so Google
// re-fetches current inventory on its own schedule, so there's nothing to
// gain (and real risk of a stale "in stock" claim) from Next.js caching it.
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Google Merchant Center's `condition` attribute only accepts
 * new | refurbished | used. PongoLux's finer-grained condition scale
 * (like_new/excellent/very_good/good/fair) all collapse to "used" here —
 * only a literal "new" listing (rare, but the schema allows it) maps to
 * Merchant Center's "new". Nothing here is ever "refurbished". */
function toMerchantCondition(condition: string): "new" | "used" {
  return condition === "new" ? "new" : "used";
}

/** Google's product taxonomy, given as the full category-path text —
 * Merchant Center accepts either the numeric taxonomy ID or this exact
 * text and matches on it. Worth a spot-check against Merchant Center's own
 * category picker if a product ever gets flagged for miscategorization. */
const GOOGLE_PRODUCT_CATEGORY: Record<string, string> = {
  handbag:
    "Apparel & Accessories > Handbags, Wallets & Cases > Handbags & Purses",
  wallet:
    "Apparel & Accessories > Handbags, Wallets & Cases > Wallets & Money Clips",
  accessory: "Apparel & Accessories > Clothing Accessories",
  other: "",
};

/** A TSV field can't contain a literal tab or newline — Google's feed spec
 * says to strip/collapse them rather than escape them. */
function tsvSafe(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").trim();
}

function fallbackDescription(p: Awaited<
  ReturnType<typeof getMerchantFeedProducts>
>[number]): string {
  return [
    `${p.brand} ${p.model}`,
    `Authenticated pre-owned ${p.category === "handbag" ? "handbag" : p.category}.`,
    p.conditionNotes,
    p.dimensions ? `Dimensions: ${p.dimensions}.` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

// Column order doesn't matter to Merchant Center (it matches on the header
// names), but keeping ours fixed makes every row easy to eyeball.
const COLUMNS = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "availability",
  "price",
  "brand",
  "condition",
  "google_product_category",
  "product_type",
  "color",
  "identifier_exists",
] as const;

export async function GET() {
  const items = await getMerchantFeedProducts();

  const rows = items.map((p) => {
    const description = tsvSafe(p.description?.trim() || fallbackDescription(p));

    const record: Record<(typeof COLUMNS)[number], string> = {
      id: p.sku,
      title: tsvSafe(p.title),
      description,
      link: `${SITE_URL}/product/${p.sku}`,
      image_link: p.imageUrl ?? "",
      // Google's feed spec uses spaced values here ("in stock"), not the
      // underscored "in_stock" the JSON Content/Merchant API uses — worth
      // confirming zero "invalid availability" errors in Merchant Center's
      // diagnostics once this is first submitted.
      availability: "in stock",
      price: `${(p.priceCents / 100).toFixed(2)} ${p.currency.toUpperCase()}`,
      brand: tsvSafe(p.brand),
      condition: toMerchantCondition(p.condition),
      google_product_category: GOOGLE_PRODUCT_CATEGORY[p.category] ?? "",
      product_type: tsvSafe(`${p.brand} ${p.category}`),
      color: tsvSafe(p.color),
      // Every PongoLux item is one-of-one with no manufacturer GTIN/MPN on
      // file — "no" tells Google not to require or penalize their absence,
      // the standard setting for unique/vintage/handmade goods.
      identifier_exists: "no",
    };

    return COLUMNS.map((col) => record[col]).join("\t");
  });

  const body = [COLUMNS.join("\t"), ...rows].join("\n") + "\n";

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      // Merchant Center re-fetches this on its own schedule — no reason
      // for a CDN or browser cache to serve a stale copy in between.
      "Cache-Control": "no-store",
    },
  });
}
