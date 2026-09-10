import { getStripe } from "@/lib/stripe";
import { db } from "@/db";
import { orders, orderItems, products, addresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendOrderConfirmationEmail, sendNewOrderNotificationEmail } from "@/lib/email";
import { endEbayListingForProduct } from "@/lib/ebay";
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

    // If Stripe Tax was on for this session, total_details.amount_tax and
    // amount_total are the authoritative post-tax figures — replace our
    // pre-tax estimate (subtotal + shipping, computed before Stripe
    // calculated anything) with what was actually charged. For orders
    // placed with tax disabled, amount_tax is absent/0 and amount_total
    // just matches what we already had.
    const taxCents = session.total_details?.amount_tax ?? 0;
    const totalCents = session.amount_total ?? order.totalCents;

    await db
      .update(orders)
      .set({
        status: "paid",
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
        email: session.customer_details?.email ?? order.email,
        taxCents,
        totalCents,
        ...(shippingAddressId ? { shippingAddressId } : {}),
      })
      .where(eq(orders.id, orderId));

    const items = await db
      .select({
        productId: orderItems.productId,
        title: orderItems.titleSnapshot,
        priceCents: orderItems.priceCentsSnapshot,
        imageUrl: orderItems.imageUrlSnapshot,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      if (!item.productId) continue;
      await db
        .update(products)
        .set({ status: "sold", reservedUntil: null, reservedByCartId: null })
        .where(eq(products.id, item.productId));

      // A one-of-one piece that just sold on the website can't still be
      // sitting live on eBay — end it there too. Best-effort: an eBay
      // hiccup here must never block the order/product updates above,
      // which already succeeded and matter far more (same reasoning as
      // the email sends below). If this does fail, it's recorded on the
      // product's ebay_listing row (see endEbayListingForProduct) so it's
      // visible on the product's admin edit page rather than only here.
      try {
        await endEbayListingForProduct(item.productId);
      } catch (err) {
        console.error(
          "Failed to end eBay listing after website sale for product",
          item.productId,
          err
        );
      }
    }

    let shippingAddress: {
      fullName: string;
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    } | null = null;
    if (shippingAddressId) {
      const [addr] = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, shippingAddressId))
        .limit(1);
      if (addr) shippingAddress = addr;
    }

    // The order/product DB updates above already succeeded — don't let a
    // Resend failure turn into a 500 here, which would make Stripe retry
    // a webhook that already did its actual job. Both emails are sent
    // independently so a failure on one (e.g. a bad customer email
    // address) doesn't also swallow the internal sale notification.
    if (order.email) {
      try {
        await sendOrderConfirmationEmail({
          to: order.email,
          orderId: order.id,
          items,
          subtotalCents: order.subtotalCents,
          shippingCents: order.shippingCents,
          totalCents,
          taxCents,
          shippingAddress,
        });
      } catch (err) {
        console.error("Failed to send order confirmation email for order", order.id, err);
      }
    }

    try {
      await sendNewOrderNotificationEmail({
        orderId: order.id,
        buyerEmail: order.email ?? "(no email on file)",
        items,
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        totalCents,
        taxCents,
        shippingAddress,
      });
    } catch (err) {
      console.error("Failed to send new order notification email for order", order.id, err);
    }
  }

  return new Response("ok", { status: 200 });
}
