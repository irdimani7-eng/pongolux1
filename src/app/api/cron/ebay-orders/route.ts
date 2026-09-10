import { NextResponse } from "next/server";
import { syncEbayOrders } from "@/lib/ebay";

// Always run fresh — this is a scheduled job, not a page, so there's
// nothing to cache.
export const dynamic = "force-dynamic";

/**
 * Polls eBay for orders since the last run and marks any matching
 * PongoLux product sold — see syncEbayOrders() in src/lib/ebay.ts for the
 * actual logic. Meant to be hit on a schedule, not by a browser. Deliberately
 * NOT wired up via a vercel.json `crons` entry: this project is still on
 * Vercel's Hobby (free) plan as of this writing, which caps cron jobs at
 * once a day, and a schedule that violates the plan's limits can fail the
 * whole deployment — not worth that risk for a "nice to have" sync job.
 *
 * Recommended setup instead: a free external scheduler (e.g.
 * cron-job.org) hitting
 *   https://www.pongolux.com/api/cron/ebay-orders?secret=<CRON_SECRET>
 * every 15–30 minutes — works on any Vercel plan, no deploy config
 * needed. Once/if this project moves to Vercel Pro, a `crons` entry in
 * vercel.json calling this path is the tidier alternative (Vercel sends
 * its own `Authorization: Bearer $CRON_SECRET` header automatically).
 *
 * Without CRON_SECRET set at all, this route refuses every request —
 * it moves real inventory state (marking a product sold), so it's not
 * left open to anyone who finds the URL.
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

  const result = await syncEbayOrders();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
