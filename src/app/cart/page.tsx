"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { useCartHydrated } from "@/lib/use-hydrated";
import { formatPrice } from "@/lib/format";
import { releaseProductAction } from "@/lib/actions/cart";
import { createCheckoutSession } from "@/lib/actions/checkout";

export default function CartPage() {
  const hydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents, 0);

  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-(family-name:--font-display) text-2xl">
          Your bag is empty
        </h1>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-(family-name:--font-display) text-3xl">Your bag</h1>

      <ul className="mt-8 divide-y divide-border">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-4 py-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {item.brand}
                </div>
                <Link href={`/product/${item.slug}`} className="font-medium hover:text-accent">
                  {item.title}
                </Link>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{formatPrice(item.priceCents, item.currency)}</span>
                <button
                  onClick={() => {
                    startTransition(async () => {
                      await releaseProductAction(item.productId);
                      removeItem(item.productId);
                    });
                  }}
                  className="text-muted-foreground hover:text-danger"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-lg">
        <span>Subtotal</span>
        <span>{formatPrice(subtotalCents)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Shipping and any applicable tax are calculated at checkout.
      </p>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <button
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await createCheckoutSession(
              items.map((i) => i.productId)
            );
            // A successful call redirects and never resolves here; if we do
            // get a result back, checkout couldn't proceed.
            if (result && !result.ok) {
              setError(result.message ?? "Checkout failed. Please try again.");
            }
          });
        }}
        className="mt-6 w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Redirecting to checkout…" : "Proceed to checkout"}
      </button>
    </div>
  );
}
