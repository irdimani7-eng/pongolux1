"use server";

import { db } from "@/db";
import { orders, orderItems, products, productImages } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getOrCreateCartId } from "@/lib/cart-id";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function createCheckoutSession(productIds: string[]) {
  if (productIds.length === 0) {
    return { ok: false as const, message: "Your cart is empty." };
  }

  const cartId = await getOrCreateCartId();
  const session = await auth();

  // Re-fetch from the database — never trust prices or availability the
  // client sent. Also re-confirms this cart still holds the reservation.
  const items = await db
    .select({
      id: products.id,
      title: products.title,
      brand: products.brand,
      priceCents: products.priceCents,
      currency: products.currency,
      status: products.status,
      reservedByCartId: products.reservedByCartId,
    })
    .from(products)
    .where(inArray(products.id, productIds));

  const unavailable = items.filter(
    (item) =>
      item.status === "sold" ||
      item.status === "archived" ||
      (item.status === "reserved" && item.reservedByCartId !== cartId)
  );
  if (unavailable.length > 0) {
    return {
      ok: false as const,
      message: `${unavailable[0].title} is no longer available. Please remove it from your cart.`,
    };
  }
  if (items.length !== productIds.length) {
    return { ok: false as const, message: "Some items in your cart no longer exist." };
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents, 0);

  const [order] = await db
    .insert(orders)
    .values({
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? "",
      status: "pending",
      subtotalCents,
      shippingCents: 0,
      totalCents: subtotalCents,
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    await Promise.all(
      items.map(async (item) => {
        const [image] = await db
          .select({ url: productImages.url })
          .from(productImages)
          .where(eq(productImages.productId, item.id))
          .limit(1);
        return {
          orderId: order.id,
          productId: item.id,
          titleSnapshot: `${item.brand} ${item.title}`,
          priceCentsSnapshot: item.priceCents,
          imageUrlSnapshot: image?.url ?? null,
        };
      })
    )
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let checkoutUrl: string | null;
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item) => ({
        quantity: 1,
        price_data: {
          currency: item.currency,
          unit_amount: item.priceCents,
          product_data: { name: `${item.brand} ${item.title}` },
        },
      })),
      shipping_address_collection: { allowed_countries: ["US"] },
      phone_number_collection: { enabled: true },
      customer_email: session?.user?.email ?? undefined,
      metadata: { orderId: order.id },
      success_url: `${siteUrl}/checkout/success?order=${order.id}`,
      cancel_url: `${siteUrl}/cart`,
    });

    await db
      .update(orders)
      .set({ stripeCheckoutSessionId: checkoutSession.id })
      .where(eq(orders.id, order.id));

    checkoutUrl = checkoutSession.url;
  } catch (err) {
    // Most likely cause during setup: STRIPE_SECRET_KEY is a placeholder or
    // missing. Surface a friendly message instead of a framework error page.
    console.error("Stripe checkout session creation failed", err);
    return {
      ok: false as const,
      message:
        "We couldn't start checkout right now. Please try again shortly, or contact us if this keeps happening.",
    };
  }

  if (!checkoutUrl) {
    return { ok: false as const, message: "Could not start checkout. Please try again." };
  }

  redirect(checkoutUrl);
}
