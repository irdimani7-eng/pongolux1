import { db } from "@/db";
import {
  products,
  productImages,
  cartEmails,
  abandonedCartReminders,
} from "@/db/schema";
import { and, asc, eq, inArray, lt } from "drizzle-orm";
import { sendAbandonedCartReminderEmail } from "@/lib/email";

// How long after a reservation hold expires before we email about it. Long
// enough that we're not interrupting someone who's still mid-payment on
// Stripe's own checkout page (the 15-minute hold and Stripe's session are
// separate timers — see createCheckoutSession in src/lib/actions/
// checkout.ts), short enough that the reminder still lands while interest
// in a one-of-one piece is fresh.
const GRACE_MINUTES = 15;

/**
 * Finds reservation holds that expired more than GRACE_MINUTES ago, are
 * still sitting in "reserved" status (nobody else has picked the item up
 * since — see the lazy-expiry note on products.reservedUntil in
 * src/db/schema.ts), and haven't already gotten a reminder for this exact
 * hold, then emails whichever of those carts have a known email address.
 * Multiple abandoned items from the same cart are grouped into one email
 * rather than one per item.
 *
 * Meant to be called on a schedule — see src/app/api/cron/abandoned-carts/
 * route.ts, which mirrors the same external-scheduler pattern already used
 * for src/app/api/cron/ebay-orders/route.ts (Vercel Hobby's cron caps don't
 * apply to an externally-triggered route).
 */
export async function sendAbandonedCartReminders(): Promise<{
  ok: boolean;
  sent: number;
  skipped: number;
  error?: string;
}> {
  try {
    const cutoff = new Date(Date.now() - GRACE_MINUTES * 60_000);

    const expired = await db
      .select({
        id: products.id,
        sku: products.sku,
        brand: products.brand,
        title: products.title,
        priceCents: products.priceCents,
        currency: products.currency,
        reservedUntil: products.reservedUntil,
        reservedByCartId: products.reservedByCartId,
      })
      .from(products)
      .where(and(eq(products.status, "reserved"), lt(products.reservedUntil, cutoff)));

    if (expired.length === 0) return { ok: true, sent: 0, skipped: 0 };

    // Filter out holds we've already reminded about (see the unique index
    // on abandoned_cart_reminder(product_id, reserved_until) — this check
    // is a courtesy to avoid the insert failing, the index is the real
    // guarantee against a double-send).
    const alreadyReminded = await db
      .select({
        productId: abandonedCartReminders.productId,
        reservedUntil: abandonedCartReminders.reservedUntil,
      })
      .from(abandonedCartReminders)
      .where(
        inArray(
          abandonedCartReminders.productId,
          expired.map((p) => p.id)
        )
      );
    const remindedKeys = new Set(
      alreadyReminded.map((r) => `${r.productId}|${r.reservedUntil.getTime()}`)
    );

    const candidates = expired.filter(
      (p) =>
        p.reservedByCartId &&
        p.reservedUntil &&
        !remindedKeys.has(`${p.id}|${p.reservedUntil.getTime()}`)
    ) as ((typeof expired)[number] & {
      reservedByCartId: string;
      reservedUntil: Date;
    })[];
    if (candidates.length === 0) return { ok: true, sent: 0, skipped: expired.length };

    const cartIds = [...new Set(candidates.map((p) => p.reservedByCartId))];
    const knownEmails = await db
      .select()
      .from(cartEmails)
      .where(inArray(cartEmails.cartId, cartIds));
    const emailByCart = new Map(knownEmails.map((e) => [e.cartId, e.email]));

    // Group by cart so a shopper who abandoned several items gets one
    // email, not a burst of separate ones.
    const byCart = new Map<string, typeof candidates>();
    for (const item of candidates) {
      if (!emailByCart.has(item.reservedByCartId)) continue; // no email on file — nothing to send
      const list = byCart.get(item.reservedByCartId) ?? [];
      list.push(item);
      byCart.set(item.reservedByCartId, list);
    }

    let sent = 0;
    let skipped = candidates.length;
    for (const [cartId, items] of byCart) {
      const email = emailByCart.get(cartId)!;
      const withImages = await Promise.all(
        items.map(async (item) => {
          const [image] = await db
            .select({ url: productImages.url })
            .from(productImages)
            .where(eq(productImages.productId, item.id))
            .orderBy(asc(productImages.position))
            .limit(1);
          return { ...item, imageUrl: image?.url ?? null };
        })
      );

      try {
        await sendAbandonedCartReminderEmail({ to: email, items: withImages });
      } catch (err) {
        // Don't record a reminder for a send that actually failed — leave
        // it unreminded so the next run retries it.
        console.error("Abandoned-cart reminder email failed for cart", cartId, err);
        continue;
      }

      await db
        .insert(abandonedCartReminders)
        .values(
          items.map((item) => ({
            productId: item.id,
            cartId,
            reservedUntil: item.reservedUntil,
          }))
        )
        .onConflictDoNothing();

      sent += items.length;
      skipped -= items.length;
    }

    return { ok: true, sent, skipped };
  } catch (err) {
    console.error("sendAbandonedCartReminders failed", err);
    return {
      ok: false,
      sent: 0,
      skipped: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
