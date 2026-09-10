import { requireAdmin } from "@/lib/admin";
import { isEbayConnected } from "@/lib/ebay";

/** One-time eBay connect screen. Not much to it by design — the actual
 * OAuth exchange happens in /api/ebay/connect (redirects to eBay) and
 * /api/ebay/callback (stores the resulting tokens); this page just shows
 * whether that's already been done and links to redo it if needed (e.g.
 * switching from a sandbox connection to a production one). */
export default async function EbayAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  await requireAdmin();
  const { connected, error } = await searchParams;
  const alreadyConnected = await isEbayConnected();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-(family-name:--font-display) text-3xl">eBay</h1>

      {connected && (
        <p className="mt-4 rounded-md border border-green-600 bg-green-50 p-3 text-sm text-green-800">
          Connected — you can now list products on eBay from each product&apos;s edit page.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md border border-red-600 bg-red-50 p-3 text-sm text-red-800">
          Couldn&apos;t connect: {error}
        </p>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        Status: {alreadyConnected ? "Connected" : "Not connected"}
      </p>

      <p className="mt-2 text-sm text-muted-foreground">
        This one-time step lets PongoLux&apos;s website publish and manage listings on
        your eBay seller account. Before clicking connect, make sure{" "}
        <code className="rounded bg-muted px-1">EBAY_APP_ID</code>,{" "}
        <code className="rounded bg-muted px-1">EBAY_CERT_ID</code>, and{" "}
        <code className="rounded bg-muted px-1">EBAY_RU_NAME</code> are set in
        Vercel, and that Business Policies are turned on in eBay Seller Hub.
      </p>

      <a
        href="/api/ebay/connect"
        className="mt-4 inline-block rounded-md border border-border px-4 py-2 text-sm hover:border-accent"
      >
        {alreadyConnected ? "Reconnect eBay" : "Connect eBay"}
      </a>
    </div>
  );
}
