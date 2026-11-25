import { NextResponse } from "next/server";
import { and, asc, desc, eq, gte, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { products, productImages } from "@/db/schema";
import { toAbsoluteImageUrl } from "@/lib/format";

// ChatGPT product feed ("Use a hosted URL" in ChatGPT's merchant setup).
// Built live from the database on every request so stock is never stale:
// a bag that sells on pongolux.com shows as out_of_stock the next time
// ChatGPT fetches this URL, with no manual re-upload.
//
// Field names follow OpenAI's product feed spec as of late 2025 — compare
// against the "View product feed format" link in ChatGPT's merchant setup
// and adjust any names it reports as unknown or missing.
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Every item is one-of-one, so a sale means it's gone for good. Sold items
// stay in the feed as out_of_stock for this many days so ChatGPT drops
// them on its next fetch instead of keeping an old "in stock" copy.
const SOLD_LOOKBACK_DAYS = 30;

// Matches the 3-day return window on /shipping-returns.
const RETURN_WINDOW_DAYS = 3;

const CATEGORY_PATH: Record<string, string> = {
  handbag: "Apparel & Accessories > Handbags, Wallets & Cases > Handbags & Purses",
  wallet: "Apparel & Accessories > Handbags, Wallets & Cases > Wallets & Money Clips",
  accessory: "Apparel & Accessories > Clothing Accessories",
  other: "Apparel & Accessories",
};

const COLUMNS = [
  "enable_search",
  "enable_checkout",
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "additional_image_link",
  "price",
  "sale_price",
  "availability",
  "inventory_quantity",
  "condition",
  "brand",
  "product_category",
  "color",
  "dimensions",
  "gender",
  "age_group",
  "seller_name",
  "seller_url",
  "seller_privacy_policy",
  "seller_tos",
  "return_policy",
  "return_window",
] as const;

type Column = (typeof COLUMNS)[number];

/** TSV fields can't hold tabs or newlines. */
function tsvSafe(value: string | null | undefined): string {
  return (value ?? "").replace(/[\t\r\n]+/g, " ").trim();
}

function money(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

export async function GET() {
  const soldSince = new Date(Date.now() - SOLD_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(products)
    .where(
      or(
        inArray(products.status, ["available", "reserved"]),
        and(eq(products.status, "sold"), gte(products.updatedAt, soldSince))
      )
    )
    .orderBy(desc(products.createdAt));

  const ids = rows.map((r) => r.id);
  const images = ids.length
    ? await db
        .select({ productId: productImages.productId, url: productImages.url })
        .from(productImages)
        .where(inArray(productImages.productId, ids))
        .orderBy(asc(productImages.position))
    : [];

  const imagesByProduct = new Map<string, string[]>();
  for (const img of images) {
    const list = imagesByProduct.get(img.productId) ?? [];
    list.push(toAbsoluteImageUrl(img.url));
    imagesByProduct.set(img.productId, list);
  }

  const lines = rows.map((p) => {
    // "reserved" = held in someone's cart; reservedUntil lapsing makes it
    // buyable again, so only treat a still-active hold as unavailable.
    const reservedNow =
      p.status === "reserved" && (!p.reservedUntil || p.reservedUntil > new Date());
    const inStock = p.status === "available" || (p.status === "reserved" && !reservedNow);

    const imgs = imagesByProduct.get(p.id) ?? [];
    const onSale = p.compareAtPriceCents != null && p.compareAtPriceCents > p.priceCents;

    const description =
      p.description?.trim() ||
      [
        `${p.brand} ${p.model}.`,
        `Authenticated pre-owned ${p.category}.`,
        p.conditionNotes,
        p.dimensions ? `Dimensions: ${p.dimensions}.` : null,
      ]
        .filter(Boolean)
        .join(" ");

    const record: Record<Column, string> = {
      enable_search: "true",
      // Checkout stays on pongolux.com (Stripe). ChatGPT Instant Checkout
      // needs a separate Agentic Commerce integration.
      enable_checkout: "false",
      id: p.sku,
      title: tsvSafe(p.title),
      description: tsvSafe(description),
      link: `${SITE_URL}/product/${p.sku}`,
      image_link: imgs[0] ?? "",
      additional_image_link: imgs.slice(1, 10).join(","),
      // When marked down, price = original, sale_price = current price.
      price: money(onSale ? p.compareAtPriceCents! : p.priceCents, p.currency),
      sale_price: onSale ? money(p.priceCents, p.currency) : "",
      availability: inStock ? "in_stock" : "out_of_stock",
      inventory_quantity: inStock ? "1" : "0",
      condition: p.condition === "new" ? "new" : "used",
      brand: tsvSafe(p.brand),
      product_category: CATEGORY_PATH[p.category] ?? CATEGORY_PATH.other,
      color: tsvSafe(p.color),
      dimensions: tsvSafe(p.dimensions),
      gender: "female",
      age_group: "adult",
      seller_name: "PongoLux",
      seller_url: SITE_URL,
      seller_privacy_policy: `${SITE_URL}/privacy`,
      seller_tos: `${SITE_URL}/terms`,
      return_policy: `${SITE_URL}/shipping-returns`,
      return_window: String(RETURN_WINDOW_DAYS),
    };

    return COLUMNS.map((c) => record[c]).join("\t");
  });

  const body = [COLUMNS.join("\t"), ...lines].join("\n") + "\n";

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
