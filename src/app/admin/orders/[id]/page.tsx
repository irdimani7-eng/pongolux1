import { notFound } from "next/navigation";
import { getOrderForAdmin } from "@/lib/admin-data";
import { formatPrice } from "@/lib/format";
import { OrderStatusForm } from "@/components/admin/order-status-form";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderForAdmin(id);
  if (!order) notFound();

  const addr = order.shippingAddress;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-(family-name:--font-display) text-3xl">
        Order #{order.id.slice(0, 8)}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Placed {order.createdAt.toLocaleString()}
      </p>

      <div className="mt-8">
        <OrderStatusForm orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <h2 className="text-sm font-medium">Items</h2>
        <ul className="mt-4 divide-y divide-border text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between py-2">
              <span>{item.titleSnapshot}</span>
              <span>{formatPrice(item.priceCentsSnapshot)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping/insurance</span>
            <span>{formatPrice(order.shippingCents)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatPrice(order.totalCents)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <h2 className="text-sm font-medium">Customer</h2>
        <p className="mt-2 text-sm">{order.email}</p>
        {order.user && (
          <p className="text-sm text-muted-foreground">
            Account: {order.user.name ?? order.user.email}
          </p>
        )}
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <h2 className="text-sm font-medium">Shipping address</h2>
        {addr ? (
          <address className="mt-2 text-sm not-italic text-muted-foreground">
            {addr.fullName}
            <br />
            {addr.line1}
            {addr.line2 && (
              <>
                <br />
                {addr.line2}
              </>
            )}
            <br />
            {addr.city}, {addr.state} {addr.postalCode}
            <br />
            {addr.country}
            {addr.phone && (
              <>
                <br />
                {addr.phone}
              </>
            )}
          </address>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No shipping address on file — Stripe collects this at checkout;
            check the Stripe Dashboard for this payment if it&apos;s missing
            here.
          </p>
        )}
      </div>
    </div>
  );
}
