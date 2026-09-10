import Link from "next/link";
import Script from "next/script";
import { db } from "@/db";
import { orders, orderItems, addresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatPrice } from "@/lib/format";
import { ClearCartOnMount } from "@/components/clear-cart-on-mount";
import { getStripe } from "@/lib/stripe";
import { CheckCircle2 } from "lucide-react";

const GOOGLE_MERCHANT_ID = 5397913684;

// PongoLux's stated policy is "ships within 3 business days" (see
// about/shipping-returns pages), plus a domestic transit estimate. Google
// Customer Reviews just needs a reasonable estimate, not an exact date, so
// we approximate rather than track real carrier ETAs.
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Defense in depth: a literal "</script" inside a JSON.stringify'd value
// (e.g. an unusual email) would otherwise close the inline <script> tag
// early in the browser's HTML parser, regardless of JS string context.
function safeInlineJSON(value: unknown): string {
  return JSON.stringify(value).replace(/<\/script/gi, "<\\/script");
}

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
  const shippingAddress = order?.shippingAddressId
    ? (
        await db
          .select()
          .from(addresses)
          .where(eq(addresses.id, order.shippingAddressId))
          .limit(1)
      )[0]
    : null;
  const deliveryCountry = shippingAddress?.country ?? "US";
  const estimatedDeliveryDate = order
    ? toISODate(addBusinessDays(new Date(order.createdAt), 7))
    : null;

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

      {order && estimatedDeliveryDate && (
        <>
          {/*
            Google Customer Reviews opt-in (Merchant Center). Defining
            window.renderOptIn before platform.js loads (rather than
            Google's default snippet order) avoids a race where the async
            script could finish loading before the callback exists.
          */}
          <Script id="google-customer-reviews-optin" strategy="afterInteractive">
            {`
              window.renderOptIn = function () {
                window.gapi.load('surveyoptin', function () {
                  window.gapi.surveyoptin.render(${safeInlineJSON({
                    merchant_id: GOOGLE_MERCHANT_ID,
                    order_id: order.id,
                    email: order.email,
                    delivery_country: deliveryCountry,
                    estimated_delivery_date: estimatedDeliveryDate,
                  })});
                });
              };
            `}
          </Script>
          <Script
            src="https://apis.google.com/js/platform.js?onload=renderOptIn"
            strategy="afterInteractive"
          />
        </>
      )}
    </div>
  );
}
