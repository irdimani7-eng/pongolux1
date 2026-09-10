import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { connectWithAuthorizationCode } from "@/lib/ebay";

/** Step 2 of the connect flow — eBay redirects here with a `code` after
 * the admin grants consent on eBay's own site. Exchanges it for tokens
 * and stores them, then sends the admin back to /admin/ebay to see the
 * result. (Note: this doesn't verify the OAuth `state` param against a
 * stored value — acceptable here since the route is already admin-gated
 * and this is a one-time low-frequency setup action, not a
 * customer-facing flow, but worth tightening if this ever becomes
 * multi-admin/self-serve.) */
export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/ebay?error=${encodeURIComponent(error)}`, request.url)
    );
  }
  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/ebay?error=missing_code", request.url)
    );
  }

  try {
    await connectWithAuthorizationCode(code);
    return NextResponse.redirect(new URL("/admin/ebay?connected=1", request.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(
      new URL(`/admin/ebay?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
