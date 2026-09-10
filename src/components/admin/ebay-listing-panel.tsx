"use client";

import { useActionState } from "react";
import { listProductOnEbayAction, endEbayListingAction } from "@/lib/actions/ebay";

type EbayListing = {
  status: "draft" | "active" | "ended" | "error";
  ebayListingId: string | null;
  lastError: string | null;
  lastSyncedAt: Date | null;
} | null;

const STATUS_LABEL: Record<NonNullable<EbayListing>["status"], string> = {
  draft: "Draft (not yet published)",
  active: "Live on eBay",
  ended: "Ended",
  error: "Failed — see error below",
};

/** Shown on a product's admin edit page. Lets an admin push the listing
 * to eBay or end it, and always shows the current known state — including
 * a failed attempt's error message, rather than a silent no-op — since
 * this integration hasn't been tested against a live eBay account yet
 * (see src/lib/ebay.ts) and the first real errors are expected to need a
 * look. */
export function EbayListingPanel({
  productId,
  listing,
  ebayConnected,
}: {
  productId: string;
  listing: EbayListing;
  ebayConnected: boolean;
}) {
  const [listState, listAction, listPending] = useActionState(
    listProductOnEbayAction.bind(null, productId),
    null
  );
  const [endState, endAction, endPending] = useActionState(
    endEbayListingAction.bind(null, productId),
    null
  );

  return (
    <div className="mt-8 rounded-lg border border-border p-4">
      <h2 className="font-medium">eBay</h2>

      {!ebayConnected ? (
        <p className="mt-2 text-sm text-muted-foreground">
          eBay isn&apos;t connected yet.{" "}
          <a href="/admin/ebay" className="underline">
            Connect it from /admin/ebay
          </a>{" "}
          before listing anything.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Status: {listing ? STATUS_LABEL[listing.status] : "Not listed"}
            {listing?.ebayListingId ? ` (eBay listing ${listing.ebayListingId})` : ""}
          </p>
          {listing?.lastError && (
            <p className="mt-1 text-sm text-red-600">{listing.lastError}</p>
          )}

          <div className="mt-3 flex gap-3">
            <form action={listAction}>
              <button
                type="submit"
                disabled={listPending || listing?.status === "active"}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent disabled:opacity-50"
              >
                {listPending
                  ? "Publishing…"
                  : listing?.status === "active"
                    ? "Listed"
                    : "List on eBay"}
              </button>
            </form>
            {listing?.status === "active" && (
              <form action={endAction}>
                <button
                  type="submit"
                  disabled={endPending}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent disabled:opacity-50"
                >
                  {endPending ? "Ending…" : "End eBay listing"}
                </button>
              </form>
            )}
          </div>

          {listState?.error && (
            <p className="mt-2 text-sm text-red-600">{listState.error}</p>
          )}
          {endState?.error && (
            <p className="mt-2 text-sm text-red-600">{endState.error}</p>
          )}
        </>
      )}
    </div>
  );
}
