"use server";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { ORDER_STATUSES } from "@/lib/validations";
import { sendOrderShippedEmail } from "@/lib/email";

export async function updateOrderStatusAction(
  orderId: string,
  status: (typeof ORDER_STATUSES)[number],
  trackingNumber?: string
) {
  await requireAdmin();

  const [existing] = await db
    .select({ status: orders.status, email: orders.email })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  await db
    .update(orders)
    .set({
      status,
      ...(trackingNumber !== undefined
        ? { trackingNumber: trackingNumber || null }
        : {}),
    })
    .where(eq(orders.id, orderId));

  // Send the "shipped" email only on the transition INTO fulfilled — not
  // on every save — so re-saving an already-fulfilled order (e.g. just to
  // add a tracking number after the fact) doesn't re-notify the customer.
  if (existing && existing.status !== "fulfilled" && status === "fulfilled") {
    await sendOrderShippedEmail({
      to: existing.email,
      orderId,
      trackingNumber: trackingNumber || null,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account");
}
