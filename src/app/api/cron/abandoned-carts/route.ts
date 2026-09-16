import { NextResponse } from "next/server";
import { sendAbandonedCartReminders } from "@/lib/abandoned-cart";

// Always run fresh — this is a scheduled job, not a page, so there's
// nothing to cache.
export const dynamic = "force-dynamic";

/**
 * Finds reservation holds that expired without a completed purchase and
 * emails a reminder to whichever carts have a known email address — see
 * sendAbandonedCartReminders() in src/lib/abandoned-cart.ts for the actual
 * logic. Meant to be hit on a schedule, not by a browser.
 *
 * Same pattern as src/app/api/cron/ebay-orders/route.ts (see that file's
 * comment for the full reasoning): deliberately NOT wired up via a
 * vercel.json `crons` entry, since this project is still on Vercel's Hobby
 * plan, which caps cron jobs at once a day — far too infrequent for a
 * 15-minute reservation hold. Recommended setup instead: a free external
 * scheduler (e.g. cron-job.org) hitting
 *   https://www.pongolux.com/api/cron/abandoned-carts?secret=<CRON_SECRET>
 * every 10–15 minutes. Uses the same CRON_SECRET env var as the eBay sync
 * job — no new secret to set up if that's already configured.
 *
 * Without CRON_SECRET set at all, this route refuses every request.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendAbandonedCartReminders();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
