import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  formatPrice,
  SELL_STATUS_LABELS,
  QUOTE_TYPE_LABELS,
  DREAM_STATUS_LABELS,
} from "@/lib/format";
import { getWishlistProducts } from "@/lib/wishlist";
import { getSellSubmissionsForUser } from "@/lib/sell";
import { getDreamInquiriesForUser } from "@/lib/dreams";
import { ProductCard } from "@/components/product-card";

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

  const savedItems = await getWishlistProducts(session.user.id);
  const sellSubmissions = await getSellSubmissionsForUser(session.user.id);
  const dreamInquiries = await getDreamInquiriesForUser(session.user.id);

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

      <h2 id="saved-items" className="mt-10 scroll-mt-24 text-lg font-medium">
        Saved items
      </h2>
      {savedItems.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing saved yet — tap the heart on any listing to keep it here.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
          {savedItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div id="sell-submissions" className="mt-10 scroll-mt-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Items submitted for quote</h2>
          <Link href="/sell" className="text-sm hover:text-accent">
            Sell a bag
          </Link>
        </div>
        {sellSubmissions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            You haven&apos;t submitted anything to sell yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {sellSubmissions.map((s) => (
              <li key={s.id} className="flex items-center gap-4 py-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {s.thumbnailUrl && (
                    <Image
                      src={s.thumbnailUrl}
                      alt={`${s.brand} ${s.productName}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">
                    {s.brand} {s.productName}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {SELL_STATUS_LABELS[s.status] ?? s.status}
                    {s.quoteType && ` — ${QUOTE_TYPE_LABELS[s.quoteType] ?? s.quoteType}`}
                    {s.quoteAmountCents != null && ` (${formatPrice(s.quoteAmountCents)})`}
                  </p>
                  {s.quoteNotes && (
                    <p className="mt-1 text-xs text-muted-foreground">{s.quoteNotes}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div id="dream-inquiries" className="mt-10 scroll-mt-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Bag of dreams inquiries</h2>
          <Link href="/dreams" className="text-sm hover:text-accent">
            Submit a dream
          </Link>
        </div>
        {dreamInquiries.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            You haven&apos;t told us about a bag of your dreams yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {dreamInquiries.map((d) => (
              <li key={d.id} className="py-4 text-sm">
                <p className="font-medium">
                  {d.brand} — {d.modelOrStyle}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {DREAM_STATUS_LABELS[d.status] ?? d.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
