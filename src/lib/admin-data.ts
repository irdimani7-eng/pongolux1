import "server-only";
import { db } from "@/db";
import {
  products,
  productImages,
  authenticationRecords,
  orders,
  orderItems,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

/** All products regardless of status, newest first — for the admin listing. */
export async function listProductsForAdmin() {
  const rows = await db.query.products.findMany({
    orderBy: desc(products.createdAt),
    with: {
      images: { orderBy: (img, { asc }) => asc(img.position), limit: 1 },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    sku: p.sku,
    brand: p.brand,
    title: p.title,
    priceCents: p.priceCents,
    currency: p.currency,
    status: p.status,
    imageUrl: p.images[0]?.url ?? null,
  }));
}

/** One product with everything the edit form needs. */
export async function getProductForAdmin(id: string) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      images: { orderBy: (img, { asc }) => asc(img.position) },
      authentication: true,
    },
  });
}

export async function getNextImagePosition(productId: string) {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${productImages.position}), -1)` })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  return (row?.max ?? -1) + 1;
}

/** All orders, newest first — for the admin orders list. */
export async function listOrdersForAdmin() {
  const rows = await db.query.orders.findMany({
    orderBy: desc(orders.createdAt),
    with: { items: true },
  });
  return rows.map((o) => ({
    id: o.id,
    email: o.email,
    status: o.status,
    totalCents: o.totalCents,
    createdAt: o.createdAt,
    itemTitles: o.items.map((i) => i.titleSnapshot),
  }));
}

/** One order with everything the detail page needs. */
export async function getOrderForAdmin(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: true,
      shippingAddress: true,
      user: { columns: { id: true, name: true, email: true } },
    },
  });
}

/** Quick counts for the admin dashboard home. */
export async function getAdminStats() {
  const [productCounts] = await db
    .select({
      available: sql<number>`count(*) filter (where ${products.status} = 'available')`,
      reserved: sql<number>`count(*) filter (where ${products.status} = 'reserved')`,
      sold: sql<number>`count(*) filter (where ${products.status} = 'sold')`,
      archived: sql<number>`count(*) filter (where ${products.status} = 'archived')`,
    })
    .from(products);

  const [orderCounts] = await db
    .select({
      total: sql<number>`count(*)`,
      paidRevenueCents: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} in ('paid', 'fulfilled')), 0)`,
      // Tax collected via Stripe Tax (0 for any order placed before
      // STRIPE_TAX_ENABLED was turned on) — the figure to hand off when
      // filing/remitting, not revenue you keep.
      taxCollectedCents: sql<number>`coalesce(sum(${orders.taxCents}) filter (where ${orders.status} in ('paid', 'fulfilled')), 0)`,
    })
    .from(orders);

  return {
    products: {
      available: Number(productCounts?.available ?? 0),
      reserved: Number(productCounts?.reserved ?? 0),
      sold: Number(productCounts?.sold ?? 0),
      archived: Number(productCounts?.archived ?? 0),
    },
    orders: {
      total: Number(orderCounts?.total ?? 0),
      paidRevenueCents: Number(orderCounts?.paidRevenueCents ?? 0),
      taxCollectedCents: Number(orderCounts?.taxCollectedCents ?? 0),
    },
  };
}

// Re-exported so admin server actions can reuse the same tables without a
// second import line for things like authenticationRecords/orderItems.
export { authenticationRecords, orderItems };
