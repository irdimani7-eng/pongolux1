import { getStripe } from "@/lib/stripe";
import { db } from "@/db";
import { orders, orderItems, products, addresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (!signature || !webhookSecret) throw new Error("Missing webhook signature/secret");
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) return new Response("ok", { status: 200 });

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!order || order.status === "paid") {
      return new Response("ok", { status: 200 });
    }

    // Stripe collects the shipping address during Checkout
    // (shipping_address_collection); persist it so /admin/orders can show a
    // packing label without anyone needing to look it up in the Stripe
    // Dashboard separately.
    let shippingAddressId: string | undefined;
    const shipping = session.collected_information?.shipping_details;
    if (shipping?.address) {
      const [address] = await db
        .insert(addresses)
        .values({
          fullName: shipping.name ?? session.customer_details?.name ?? "",
          line1: shipping.address.line1 ?? "",
          line2: shipping.address.line2 ?? null,
          city: shipping.address.city ?? "",
          state: shipping.address.state ?? "",
          postalCode: shipping.address.postal_code ?? "",
          country: shipping.address.country ?? "US",
          phone: session.customer_details?.phone ?? null,
        })
        .returning({ id: addresses.id });
      shippingAddressId = address?.id;
    }

    await db
      .update(orders)
      .set({
        status: "paid",
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
        email: session.customer_details?.email ?? order.email,
        ...(shippingAddressId ? { shippingAddressId } : {}),
      })
      .where(eq(orders.id, orderId));

    const items = await db
      .select({ productId: orderItems.productId })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      if (!item.productId) continue;
      await db
        .update(products)
        .set({ status: "sold", reservedUntil: null, reservedByCartId: null })
        .where(eq(products.id, item.productId));
    }

    if (order.email) {
      await sendOrderConfirmationEmail({
        to: order.email,
        orderId: order.id,
        totalCents: order.totalCents,
      });
    }
  }

  return new Response("ok", { status: 200 });
}
