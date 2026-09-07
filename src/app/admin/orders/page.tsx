import Link from "next/link";
import { listOrdersForAdmin } from "@/lib/admin-data";
import { formatPrice } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  fulfilled: "bg-green-100 text-green-800",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-red-100 text-red-800",
};

export default async function AdminOrdersPage() {
  const orders = await listOrdersForAdmin();

  return (
    <div>
      <h1 className="font-(family-name:--font-display) text-3xl">Orders</h1>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-4 font-normal">Order</th>
              <th className="py-2 pr-4 font-normal">Date</th>
              <th className="py-2 pr-4 font-normal">Customer</th>
              <th className="py-2 pr-4 font-normal">Items</th>
              <th className="py-2 pr-4 font-normal">Total</th>
              <th className="py-2 pr-4 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-mono text-xs hover:text-accent"
                  >
                    #{o.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {o.createdAt.toLocaleDateString()}
                </td>
                <td className="py-3 pr-4">{o.email || "—"}</td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {o.itemTitles.join(", ")}
                </td>
                <td className="py-3 pr-4">{formatPrice(o.totalCents)}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs capitalize ${STATUS_STYLES[o.status] ?? ""}`}
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="mt-8 text-center text-muted-foreground">
            No orders yet.
          </p>
        )}
      </div>
    </div>
  );
}
