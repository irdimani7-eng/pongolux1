"use client";

import { useActionState } from "react";
import { updateOrderStatusAction } from "@/lib/actions/admin-orders";
import { ORDER_STATUSES } from "@/lib/validations";

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [, formAction, pending] = useActionState(async (_: null, formData: FormData) => {
    const status = formData.get("status");
    await updateOrderStatusAction(
      orderId,
      status as (typeof ORDER_STATUSES)[number]
    );
    return null;
  }, null);

  return (
    <form action={formAction} className="flex items-center gap-3">
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update status"}
      </button>
    </form>
  );
}
