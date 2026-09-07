"use client";

import { useActionState } from "react";
import { updateOrderStatusAction } from "@/lib/actions/admin-orders";
import { ORDER_STATUSES } from "@/lib/validations";

export function OrderStatusForm({
  orderId,
  currentStatus,
  currentTrackingNumber,
}: {
  orderId: string;
  currentStatus: string;
  currentTrackingNumber?: string | null;
}) {
  const [, formAction, pending] = useActionState(async (_: null, formData: FormData) => {
    const status = formData.get("status");
    const trackingNumber = formData.get("trackingNumber");
    await updateOrderStatusAction(
      orderId,
      status as (typeof ORDER_STATUSES)[number],
      typeof trackingNumber === "string" ? trackingNumber.trim() : undefined
    );
    return null;
  }, null);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <select
        // Remount when the server-confirmed status changes (e.g. right
        // after a successful update) so this uncontrolled <select> picks up
        // the new defaultValue instead of silently keeping whatever was
        // selected before — otherwise it can look like the save didn't take
        // even though the database was updated correctly.
        key={currentStatus}
        name="status"
        defaultValue={currentStatus}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <input
        name="trackingNumber"
        placeholder="Tracking number (optional)"
        defaultValue={currentTrackingNumber ?? ""}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update status"}
      </button>
      <p className="w-full text-xs text-muted-foreground">
        Setting status to Fulfilled automatically emails the customer that
        their order has shipped (including the tracking number above, if
        set).
      </p>
    </form>
  );
}
