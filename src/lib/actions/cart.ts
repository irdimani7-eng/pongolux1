"use server";

import { db } from "@/db";
import { products, cartEmails } from "@/db/schema";
import { and, eq, or, isNull, lt } from "drizzle-orm";
import { getOrCreateCartId } from "@/lib/cart-id";
import { z } from "zod";

const RESERVATION_MINUTES = 15;

const CartEmailSchema = z.string().trim().toLowerCase().email();

/**
 * Associates an email with this shopper's anonymous cart, so an abandoned
 * reservation hold (see sendAbandonedCartReminders in src/lib/abandoned-
 * cart.ts) has somewhere to send a reminder. Called either automatically
 * with a signed-in shopper's session email, or from the optional email
 * field on the cart page for a signed-out one. Silent no-op on an invalid
 * email — this is a soft, optional capture, not a validated form field.
 */
export async function saveCartEmailAction(
  email: string
): Promise<{ ok: boolean }> {
  const parsed = CartEmailSchema.safeParse(email);
  if (!parsed.success) return { ok: false };

  const cartId = await getOrCreateCartId();
  await db
    .insert(cartEmails)
    .values({ cartId, email: parsed.data })
    .onConflictDoUpdate({
      target: cartEmails.cartId,
      set: { email: parsed.data, updatedAt: new Date() },
    });
  return { ok: true };
}

/**
 * Attempts to hold a one-of-one item for this shopper's cart. Since every
 * product is unique inventory (not a restockable SKU), two people can't both
 * check out the same bag — this is the guard against that. The hold expires
 * on its own (`reservedUntil`) so an abandoned cart doesn't lock an item
 * forever; no cron job needed, expiry is just checked lazily on next access.
 */
export async function reserveProductAction(
  productId: string
): Promise<{ ok: boolean; message?: string }> {
  const cartId = await getOrCreateCartId();
  const now = new Date();
  const reservedUntil = new Date(now.getTime() + RESERVATION_MINUTES * 60_000);

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) return { ok: false, message: "This item no longer exists." };
  if (product.status === "sold") {
    return { ok: false, message: "Sorry, this item just sold." };
  }
  if (product.status === "archived") {
    return { ok: false, message: "This item is no longer available." };
  }

  const alreadyHeldByMe = product.reservedByCartId === cartId;
  const holdExpired = !product.reservedUntil || product.reservedUntil < now;

  if (product.status === "reserved" && !alreadyHeldByMe && !holdExpired) {
    return {
      ok: false,
      message: "Another shopper currently has this item in their cart.",
    };
  }

  const result = await db
    .update(products)
    .set({ status: "reserved", reservedUntil, reservedByCartId: cartId })
    .where(
      and(
        eq(products.id, productId),
        or(
          eq(products.status, "available"),
          eq(products.reservedByCartId, cartId),
          isNull(products.reservedUntil),
          lt(products.reservedUntil, now)
        )
      )
    )
    .returning({ id: products.id });

  if (result.length === 0) {
    return {
      ok: false,
      message: "Sorry, someone else just reserved this item.",
    };
  }

  return { ok: true };
}

export async function releaseProductAction(productId: string) {
  const cartId = await getOrCreateCartId();
  await db
    .update(products)
    .set({ status: "available", reservedUntil: null, reservedByCartId: null })
    .where(
      and(
        eq(products.id, productId),
        eq(products.reservedByCartId, cartId),
        eq(products.status, "reserved")
      )
    );
}
