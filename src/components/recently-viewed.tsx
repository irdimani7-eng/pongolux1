"use client";

import { useRecentlyViewedStore } from "@/lib/recently-viewed-store";
import { useRecentlyViewedHydrated } from "@/lib/use-hydrated";
import { ProductCard } from "@/components/product-card";

/** "Recently viewed" strip for the bottom of a product page — sourced
 * entirely from this browser's local history (see recently-viewed-store),
 * so it's per-device rather than tied to an account, and works for
 * signed-out shoppers too. Renders nothing until there's at least one
 * other item to show. */
export function RecentlyViewed({
  excludeProductId,
}: {
  excludeProductId?: string;
}) {
  const hydrated = useRecentlyViewedHydrated();
  const items = useRecentlyViewedStore((s) => s.items);

  if (!hydrated) return null;
  const filtered = items.filter((i) => i.id !== excludeProductId).slice(0, 4);
  if (filtered.length === 0) return null;

  return (
    <div className="mt-20 border-t border-border pt-12">
      <h2 className="mb-6 font-(family-name:--font-display) text-2xl">
        Recently viewed
      </h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
