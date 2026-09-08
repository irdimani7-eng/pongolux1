"use server";

import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Toggles a product in/out of the current shopper's wishlist. Requires a
 * signed-in session — the wishlist is account-scoped (unlike the cart's
 * anonymous cookie-based reservation), so a signed-out click is reported
 * back as "sign_in_required" rather than silently doing nothing; the
 * client (WishlistProvider) sends them to /login when it sees that.
 */
export async function toggleWishlistAction(
  productId: string
): Promise<{ ok: boolean; added?: boolean; message?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, message: "sign_in_required" };
  }

  const [existing] = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(
      and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId))
    )
    .limit(1);

  if (existing) {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, existing.id));
    revalidatePath("/account");
    return { ok: true, added: false };
  }

  await db.insert(wishlistItems).values({ userId, productId });
  revalidatePath("/account");
  return { ok: true, added: true };
}
