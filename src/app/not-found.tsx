import Link from "next/link";

// Renders inside the root layout (same header/footer/branding) since this
// app has a single root layout with no top-level dynamic segments — no
// need for the separate global-not-found.js convention. Handles both an
// explicit notFound() call (e.g. a bad /product/[sku]) and any URL that
// doesn't match a route at all.
export const metadata = { title: "Page Not Found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="font-(family-name:--font-display) text-6xl text-accent">
        404
      </p>
      <h1 className="mt-4 font-(family-name:--font-display) text-2xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-2 text-muted-foreground">
        The listing may have sold, or the link might be out of date. Here are
        a couple of places to pick back up.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/shop"
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
        >
          Shop all handbags
        </Link>
        <Link
          href="/"
          className="rounded-full border border-border px-6 py-3 text-sm hover:border-foreground"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
