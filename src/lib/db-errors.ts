/** True when a Postgres insert/update failed on the unique constraint for
 * the given column (error code 23505). Shared between the single-item admin
 * actions (src/lib/actions/admin-products.ts) and the bulk-import action
 * (src/lib/actions/bulk-import.ts) so both report the same "already in use"
 * message the same way. Kept in its own plain module (no "use server")
 * because a "use server" file's exports must all be async Server Actions —
 * this is a small sync helper, not an action. */
export function isUniqueViolation(err: unknown, column: "sku" | "title") {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as { code?: string }).code === "23505" &&
    err.message.includes(column)
  );
}
