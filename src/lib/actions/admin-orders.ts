"use server";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { ORDER_STATUSES } from "@/lib/validations";

export async function updateOrderStatusAction(
  orderId: string,
  status: (typeof ORDER_STATUSES)[number]
) {
  await requireAdmin();
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account");
}
