"use client";

import { useEffect } from "react";
import { useRecentlyViewedStore } from "@/lib/recently-viewed-store";
import type { ProductDetail } from "@/lib/types";

/** Invisible — just records the current product into the shopper's
 * "recently viewed" history on mount. Placed on the product detail page. */
export function RecentlyViewedTracker({ product }: { product: ProductDetail }) {
  const record = useRecentlyViewedStore((s) => s.record);

  useEffect(() => {
    record({
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
      imageUrl: product.imageUrl,
    });
    // Re-run only if the viewed product actually changes (i.e. navigating
    // to a different product page), not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return null;
}
