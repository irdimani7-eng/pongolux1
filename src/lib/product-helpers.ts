/** Pure, dependency-free product helpers — deliberately split out of
 * lib/products.ts (which imports the DB client) so components that need
 * to run in a client bundle — like ProductCard, now also rendered inside
 * the client-only RecentlyViewed strip — can use this logic without
 * accidentally pulling `postgres`/`db` into the browser bundle. */

/** An item counts as "on sale" once it has a compare-at price higher than
 * its current price — one field drives both the strikethrough price display
 * and the /shop/price-drops collection. */
export function isOnSale(product: {
  compareAtPriceCents: number | null;
  priceCents: number;
}) {
  return (
    product.compareAtPriceCents != null &&
    product.compareAtPriceCents > product.priceCents
  );
}
