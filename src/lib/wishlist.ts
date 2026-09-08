import { db } from "@/db";
import { wishlistItems, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { primaryImageUrl } from "@/lib/products";
import type { ProductListItem } from "@/lib/types";

/** Just the saved product IDs for this shopper — enough to light up the
 * heart icon on any ProductCard/product page without fetching full product
 * rows. Used to seed WishlistProvider on first render.
 *
 * Called from the root layout on every request for a signed-in shopper, so
 * this is deliberately defensive: if the `wishlist_item` table doesn't
 * exist yet (migration-007 not run against this database), every
 * authenticated page load would otherwise 500 — logging in would look
 * completely broken instead of just the wishlist being unavailable. Fails
 * "closed" to an empty wishlist instead. */
export async function getWishlistProductIds(userId: string): Promise<string[]> {
  try {
    const rows = await db
      .select({ productId: wishlistItems.productId })
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, userId));
    return rows.map((r) => r.productId);
  } catch (err) {
    console.error("Failed to load wishlist product IDs for user", userId, err);
    return [];
  }
}

/** Full product rows for the "Saved items" section of /account, newest
 * save first. A product removed from the catalog (onDelete: cascade)
 * simply disappears from here along with its wishlist row. Same
 * fail-closed reasoning as getWishlistProductIds above. */
export async function getWishlistProducts(
  userId: string
): Promise<ProductListItem[]> {
  try {
    const rows = await db
      .select({ product: products, savedAt: wishlistItems.createdAt })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, userId))
      .orderBy(desc(wishlistItems.createdAt));

    return await Promise.all(
      rows.map(async ({ product }) => ({
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
  } catch (err) {
    console.error("Failed to load wishlist products for user", userId, err);
    return [];
  }
}
