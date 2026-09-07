import { db } from "@/db";
import { products, productImages, authenticationRecords } from "@/db/schema";
import { and, asc, desc, eq, gt, gte, lt, ne, sql } from "drizzle-orm";
import { PRICE_RANGES } from "@/lib/format";
import type {
  ProductDetail,
  ProductListItem,
  ShopFilters,
  FilterOptions,
} from "@/lib/types";

/** An item counts as "on sale" once it has a compare-at price higher than
 * its current price — one field drives both the strikethrough price display
 * and the /shop/price-drops collection, so there's no separate flag that
 * could drift out of sync with the actual prices. */
export function isOnSale(product: {
  compareAtPriceCents: number | null;
  priceCents: number;
}) {
  return (
    product.compareAtPriceCents != null &&
    product.compareAtPriceCents > product.priceCents
  );
}

async function primaryImageUrl(productId: string) {
  const [image] = await db
    .select({ url: productImages.url })
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.position))
    .limit(1);
  return image?.url ?? null;
}

export async function listProducts(
  filters?: ShopFilters & {
    /** Excludes sold items entirely (used for the homepage's "Newly
     * listed" rail — a sold piece shouldn't be the first thing a new
     * visitor sees). On /shop, leave this false: sold items still show
     * (so a link to a just-sold piece doesn't 404), just sorted last —
     * see the ORDER BY below. Archived items are always excluded, on
     * every page, regardless of this flag. */
    excludeSold?: boolean;
    /** /shop/price-drops — only items with a compare-at price above the
     * current price. */
    onSaleOnly?: boolean;
    /** /shop/most-wanted — only admin-curated picks. */
    mostWantedOnly?: boolean;
  }
): Promise<ProductListItem[]> {
  const priceRange = PRICE_RANGES.find((r) => r.value === filters?.priceRange);

  const conditions = [
    ne(products.status, "archived"),
    filters?.excludeSold ? ne(products.status, "sold") : undefined,
    filters?.onSaleOnly ? gt(products.compareAtPriceCents, products.priceCents) : undefined,
    filters?.mostWantedOnly ? eq(products.isMostWanted, true) : undefined,
    filters?.category ? eq(products.category, filters.category as never) : undefined,
    filters?.brand ? eq(products.brand, filters.brand) : undefined,
    filters?.color ? eq(products.color, filters.color) : undefined,
    filters?.condition
      ? eq(products.condition, filters.condition as never)
      : undefined,
    priceRange ? gte(products.priceCents, priceRange.min) : undefined,
    priceRange?.max != null ? lt(products.priceCents, priceRange.max) : undefined,
  ].filter((c): c is NonNullable<typeof c> => Boolean(c));

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    // Sold items sort after everything else (still reachable, just not
    // front-and-center), newest first within each group.
    .orderBy(
      sql`case when ${products.status} = 'sold' then 1 else 0 end`,
      desc(products.createdAt)
    );

  return Promise.all(
    rows.map(async (product) => ({
      id: product.id,
      sku: product.sku,
      brand: product.brand,
      model: product.model,
      title: product.title,
      color: product.color,
      category: product.category,
      condition: product.condition,
      priceCents: product.priceCents,
      compareAtPriceCents: product.compareAtPriceCents,
      currency: product.currency,
      status: product.status,
      imageUrl: await primaryImageUrl(product.id),
    }))
  );
}

/** Distinct brand/color values currently in the catalog, for the shop filter
 * dropdowns — so we never show an option with zero matching items. */
export async function getFilterOptions(): Promise<FilterOptions> {
  const rows = await db
    .select({ brand: products.brand, color: products.color })
    .from(products)
    .where(ne(products.status, "archived"));

  return {
    brands: [...new Set(rows.map((r) => r.brand))].sort(),
    colors: [...new Set(rows.map((r) => r.color))].sort(),
  };
}

export async function getProductBySku(
  sku: string
): Promise<ProductDetail | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.sku, sku))
    .limit(1);
  if (!product) return null;

  const images = await db
    .select({ url: productImages.url, alt: productImages.alt })
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.position));

  const [auth] = await db
    .select({
      method: authenticationRecords.method,
      authenticatedBy: authenticationRecords.authenticatedBy,
      certificateUrl: authenticationRecords.certificateUrl,
    })
    .from(authenticationRecords)
    .where(eq(authenticationRecords.productId, product.id))
    .limit(1);

  return {
    id: product.id,
    sku: product.sku,
    brand: product.brand,
    model: product.model,
    title: product.title,
    description: product.description,
    conditionNotes: product.conditionNotes,
    dimensions: product.dimensions,
    color: product.color,
    category: product.category,
    condition: product.condition,
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    currency: product.currency,
    status: product.status,
    isConsignment: product.isConsignment,
    imageUrl: images[0]?.url ?? null,
    images,
    authentication: auth ?? null,
  };
}
