import Link from "next/link";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatPrice } from "@/lib/format";
import { ClearCartOnMount } from "@/components/clear-cart-on-mount";
import { getStripe } from "@/lib/stripe";
import { CheckCircle2 } from "lucide-react";

export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  const { order: orderId } = await searchParams;
  const id = Array.isArray(orderId) ? orderId[0] : orderId;

  const order = id
    ? (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0]
    : null;
  const items = order
    ? await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
    : [];

  // The webhook that stamps the real (post-tax) total onto the order can
  // lag a moment behind this redirect, so read the totals straight from
  // Stripe here rather than showing a stale pre-tax number right after
  // checkout. Falls back to the DB row if the session can't be fetched
  // (e.g. an old order, or Stripe briefly unreachable).
  let taxCents = order?.taxCents ?? 0;
  let totalCents = order?.totalCents ?? 0;
  if (order?.stripeCheckoutSessionId) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(
        order.stripeCheckoutSessionId
      );
      taxCents = session.total_details?.amount_tax ?? taxCents;
      totalCents = session.amount_total ?? totalCents;
    } catch (err) {
      console.error(
        "Couldn't fetch Stripe session for checkout success totals; falling back to DB values",
        err
      );
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <ClearCartOnMount />
      <CheckCircle2 className="mx-auto size-12 text-accent" strokeWidth={1.5} />
      <h1 className="mt-4 font-(family-name:--font-display) text-3xl">
        {order ? "Thank you for your order" : "Order confirmed"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {order
          ? "We're confirming your payment and preparing your authenticated piece for shipment. A confirmation email is on its way."
          : "We couldn't find the order details for this confirmation, but if you completed checkout, your order went through."}
      </p>

      {order && (
        <div className="mt-8 rounded-lg border border-border p-4 text-left text-sm">
          <div className="flex justify-between font-medium">
            <span>Order #{order.id.slice(0, 8)}</span>
            <span>{formatPrice(totalCents)}</span>
          </div>
          <ul className="mt-3 space-y-1 text-muted-foreground">
            {items.map((item) => (
              <li key={item.id}>{item.titleSnapshot}</li>
            ))}
            {order.shippingCents > 0 && (
              <li>Shipping insurance — {formatPrice(order.shippingCents)}</li>
            )}
            {taxCents > 0 && <li>Tax — {formatPrice(taxCents)}</li>}
          </ul>
        </div>
      )}

      <Link
        href="/shop"
        className="mt-8 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
      >
        Continue shopping
      </Link>
    </div>
  );
}
