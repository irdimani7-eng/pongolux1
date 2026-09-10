import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getAuthorizationUrl } from "@/lib/ebay";

/** Step 1 of the one-time eBay connect flow — an admin hits this (via the
 * "Connect eBay" button on /admin/ebay), it sends them to eBay's consent
 * screen, and eBay redirects back to /api/ebay/callback with a code. */
export async function GET() {
  await requireAdmin();
  const state = crypto.randomUUID();
  redirect(getAuthorizationUrl(state));
}
