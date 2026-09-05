import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatPrice } from "@/lib/format";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt));

  const itemsByOrder = new Map<string, { titleSnapshot: string }[]>();
  for (const order of userOrders) {
    const items = await db
      .select({ titleSnapshot: orderItems.titleSnapshot })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    itemsByOrder.set(order.id, items);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-(family-name:--font-display) text-3xl">
        Hi {session.user.name?.split(" ")[0] ?? "there"}
      </h1>

      <h2 className="mt-10 text-lg font-medium">Order history</h2>
      {userOrders.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          You haven&apos;t placed any orders yet.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {userOrders.map((order) => (
            <li key={order.id} className="py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Order #{order.id.slice(0, 8)}
                </span>
                <span className="capitalize text-muted-foreground">
                  {order.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {itemsByOrder.get(order.id)?.map((i) => i.titleSnapshot).join(", ")}
              </p>
              <p className="mt-1 text-sm">{formatPrice(order.totalCents)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
