import Link from "next/link";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatPrice } from "@/lib/format";
import { ClearCartOnMount } from "@/components/clear-cart-on-mount";
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
            <span>{formatPrice(order.totalCents)}</span>
          </div>
          <ul className="mt-3 space-y-1 text-muted-foreground">
            {items.map((item) => (
              <li key={item.id}>{item.titleSnapshot}</li>
            ))}
            {order.shippingCents > 0 && (
              <li>Shipping insurance — {formatPrice(order.shippingCents)}</li>
            )}
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
