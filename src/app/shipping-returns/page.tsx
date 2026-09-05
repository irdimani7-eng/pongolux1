export const metadata = { title: "Shipping & Returns" };

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-(family-name:--font-display) text-3xl">
        Shipping &amp; Returns
      </h1>

      <div className="prose-sm mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Placeholder content —</strong>{" "}
          replace this page with PongoLux&apos;s real shipping carriers, handling
          time, insurance coverage, and return window before launch.
        </p>
        <p>
          Since every item is one-of-one, we recommend a clear, generous
          return window (commonly 3–7 days) with re-authentication required
          before a refund is issued, to protect against fraudulent returns.
        </p>
      </div>
    </div>
  );
}
