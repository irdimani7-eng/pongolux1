"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { useCartHydrated } from "@/lib/use-hydrated";
import { formatPrice, SHIPPING_INSURANCE_CENTS } from "@/lib/format";
import { releaseProductAction, saveCartEmailAction } from "@/lib/actions/cart";
import { createCheckoutSession } from "@/lib/actions/checkout";
import { EntrupyBadge } from "@/components/entrupy-badge";
import { CheckoutTrustStrip } from "@/components/checkout-trust-strip";

export function CartPageClient({ initialEmail }: { initialEmail: string | null }) {
  const hydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [insured, setInsured] = useState(false);

  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents, 0);
  const totalCents = subtotalCents + (insured ? SHIPPING_INSURANCE_CENTS : 0);

  // Signed-in shoppers already have an email on file — save it against this
  // cart silently, once, so an abandoned hold can still get a reminder (see
  // sendAbandonedCartReminders in src/lib/abandoned-cart.ts). No UI for this
  // path; it just happens in the background.
  const savedInitialEmail = useRef(false);
  useEffect(() => {
    if (!initialEmail || savedInitialEmail.current) return;
    savedInitialEmail.current = true;
    saveCartEmailAction(initialEmail);
  }, [initialEmail]);

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
                <Link href={`/product/${item.sku}`} className="font-medium hover:text-accent">
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

      <div className="mt-8 space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatPrice(subtotalCents)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <label className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <input
            type="checkbox"
            checked={insured}
            onChange={(e) => setInsured(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Add shipping insurance — {formatPrice(SHIPPING_INSURANCE_CENTS)}
            <span className="block text-xs text-muted-foreground">
              Covers loss or damage in transit. Optional.
            </span>
          </span>
        </label>
        <div className="flex items-center justify-between border-t border-border pt-3 text-lg">
          <span>Total</span>
          <span>{formatPrice(totalCents)}</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Any applicable tax is calculated at checkout.
      </p>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <CheckoutTrustStrip className="mt-4 justify-center" />

      {!initialEmail && <GuestEmailCapture />}

      <button
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await createCheckoutSession(
              items.map((i) => i.productId),
              { insured }
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

      <div className="mt-6 flex items-center justify-center gap-3 border-t border-border pt-6">
        <EntrupyBadge />
        <p className="text-xs text-muted-foreground">
          Every piece in your bag has been scanned and verified by Entrupy,
          plus a hands-on expert review.
        </p>
      </div>
    </div>
  );
}

/**
 * Optional email capture for a signed-out shopper, so their reservation hold
 * (see products.reservedUntil in src/db/schema.ts) can get an abandoned-cart
 * reminder if they leave without checking out. Saved on blur, not on every
 * keystroke — same debounce-free "commit on blur" idea as the rest of the
 * form, just without the extra timer since there's only one field.
 */
function GuestEmailCapture() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  const handleBlur = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setStatus("idle");
      return;
    }
    setStatus("saving");
    startSave(trimmed);
  };

  const startSave = async (email: string) => {
    const result = await saveCartEmailAction(email);
    setStatus(result.ok ? "saved" : "error");
  };

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
      <label htmlFor="cart-email" className="text-sm font-medium">
        Email <span className="font-normal text-muted-foreground">(optional)</span>
      </label>
      <p className="mt-0.5 text-xs text-muted-foreground">
        We&apos;ll let you know if your hold is about to expire.
      </p>
      <input
        id="cart-email"
        type="email"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (status !== "idle") setStatus("idle");
        }}
        onBlur={handleBlur}
        placeholder="you@example.com"
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {status === "saved" && (
        <p className="mt-1 text-xs text-muted-foreground">Saved.</p>
      )}
      {status === "error" && (
        <p className="mt-1 text-xs text-danger">
          That doesn&apos;t look like a valid email.
        </p>
      )}
    </div>
  );
}
