"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { reserveProductAction } from "@/lib/actions/cart";
import type { ProductDetail } from "@/lib/types";

export function AddToCartButton({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const alreadyInCart = useCartStore((s) =>
    s.items.some((i) => i.productId === product.id)
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (product.status === "sold") {
    return (
      <button
        disabled
        className="w-full rounded-full bg-muted px-6 py-3 text-sm font-medium text-muted-foreground"
      >
        Sold
      </button>
    );
  }

  if (alreadyInCart) {
    return (
      <button
        onClick={() => router.push("/cart")}
        className="w-full rounded-full border border-foreground px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
      >
        View in cart
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await reserveProductAction(product.id);
            if (!result.ok) {
              setError(result.message ?? "Could not add this item to your cart.");
              return;
            }
            addItem({
              productId: product.id,
              sku: product.sku,
              title: product.title,
              brand: product.brand,
              priceCents: product.priceCents,
              currency: product.currency,
              imageUrl: product.imageUrl,
            });
            router.push("/cart");
          });
        }}
        className="w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add to bag"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
