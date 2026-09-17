"use server";

import { db } from "@/db";
import { orders, orderItems, products, productImages } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getOrCreateCartId } from "@/lib/cart-id";
import { getStripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SHIPPING_INSURANCE_CENTS, CHECKOUT_HOLD_MINUTES } from "@/lib/format";
import { extendReservationForCheckout } from "@/lib/actions/cart";

export async function createCheckoutSession(
  productIds: string[],
  options?: { insured?: boolean }
) {
  if (productIds.length === 0) {
    return { ok: false as const, message: "Your cart is empty." };
  }
  const insuranceCents = options?.insured ? SHIPPING_INSURANCE_CENTS : 0;

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

  // Extend this cart's hold on every item to cover the entire Stripe
  // Checkout session about to be created below (whose own `expires_at` is
  // set to the same CHECKOUT_HOLD_MINUTES). Without this, the original
  // 15-minute cart hold could lapse while the shopper is still sitting on
  // Stripe's payment page — long enough for someone else to grab a
  // one-of-one item out from under them and for both people to end up
  // paying for the same bag. This call is atomic and cart-scoped (see
  // extendReservationForCheckout in src/lib/actions/cart.ts), so it can
  // only ever claim items this cart is genuinely entitled to hold.
  const extension = await extendReservationForCheckout(productIds);
  if (!extension.ok) {
    const lost = items.find((item) => extension.failedIds.includes(item.id));
    return {
      ok: false as const,
      message: `${lost?.title ?? "An item"} in your cart was just claimed by someone else. Please remove it and try again.`,
    };
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents, 0);

  const [order] = await db
    .insert(orders)
    .values({
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? "",
      status: "pending",
      subtotalCents,
      shippingCents: insuranceCents,
      totalCents: subtotalCents + insuranceCents,
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

  // Stripe Tax has to be activated in the Stripe Dashboard (Settings > Tax)
  // with an origin address and at least one active registration (e.g.
  // Illinois) before automatic_tax will work — enabling it here without
  // that setup done would break checkout for every customer, so it's gated
  // behind an explicit env var. See README.md "Sales tax" section.
  const taxEnabled = process.env.STRIPE_TAX_ENABLED === "true";

  let checkoutUrl: string | null;
  try {
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "payment",
      ...(taxEnabled ? { automatic_tax: { enabled: true } } : {}),
      line_items: [
        ...items.map((item) => ({
          quantity: 1,
          price_data: {
            currency: item.currency,
            unit_amount: item.priceCents,
            product_data: { name: `${item.brand} ${item.title}` },
          },
        })),
        ...(insuranceCents > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: items[0].currency,
                  unit_amount: insuranceCents,
                  product_data: {
                    name: "Shipping insurance",
                    description: "Covers loss or damage in transit",
                  },
                },
              },
            ]
          : []),
      ],
      shipping_address_collection: { allowed_countries: ["US"] },
      phone_number_collection: { enabled: true },
      customer_email: session?.user?.email ?? undefined,
      metadata: { orderId: order.id },
      success_url: `${siteUrl}/checkout/success?order=${order.id}`,
      cancel_url: `${siteUrl}/cart`,
      // Stripe's minimum is 30 minutes from creation — matches
      // CHECKOUT_HOLD_MINUTES exactly, so the reservation hold extended
      // above and this Checkout session always expire together. If Stripe
      // ever closes this session for any reason, the hold lapses at the
      // same moment and the item becomes available again rather than
      // staying locked past the point anyone could still be paying for it.
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_HOLD_MINUTES * 60,
    });

    await db
      .update(orders)
      .set({ stripeCheckoutSessionId: checkoutSession.id })
      .where(eq(orders.id, order.id));

    checkoutUrl = checkoutSession.url;
  } catch (err) {
    // Most likely causes during setup: STRIPE_SECRET_KEY is a placeholder or
    // missing, or (if STRIPE_TAX_ENABLED=true) Stripe Tax hasn't actually
    // been activated in the Dashboard yet. Surface a friendly message to the
    // customer either way, but log something actionable for us.
    if (
      taxEnabled &&
      err instanceof Error &&
      /tax/i.test(err.message)
    ) {
      console.error(
        "Stripe checkout session creation failed — STRIPE_TAX_ENABLED is true but Stripe Tax may not be activated in the Dashboard yet (Settings > Tax > origin address + registrations). Original error:",
        err
      );
    } else {
      console.error("Stripe checkout session creation failed", err);
    }
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
