import Link from "next/link";
import { getAdminStats } from "@/lib/admin-data";
import { formatPrice } from "@/lib/format";

export default async function AdminHomePage() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Available", value: stats.products.available },
    { label: "Reserved", value: stats.products.reserved },
    { label: "Sold", value: stats.products.sold },
    { label: "Archived", value: stats.products.archived },
  ];

  return (
    <div>
      <h1 className="font-(family-name:--font-display) text-3xl">Dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="text-2xl font-(family-name:--font-display)">
              {c.value}
            </div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-2xl font-(family-name:--font-display)">
            {stats.orders.total}
          </div>
          <div className="text-sm text-muted-foreground">Total orders</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-2xl font-(family-name:--font-display)">
            {formatPrice(stats.orders.paidRevenueCents)}
          </div>
          <div className="text-sm text-muted-foreground">
            Revenue (paid + fulfilled orders)
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-2xl font-(family-name:--font-display)">
            {formatPrice(stats.orders.taxCollectedCents)}
          </div>
          <div className="text-sm text-muted-foreground">
            Tax collected — set aside for filing, not revenue
          </div>
        </div>
      </div>

      <div className="mt-10 flex gap-3">
        <Link
          href="/admin/products/new"
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
        >
          + New listing
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-muted"
        >
          View orders
        </Link>
      </div>
    </div>
  );
}
