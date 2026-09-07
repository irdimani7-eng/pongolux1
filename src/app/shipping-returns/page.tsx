import { formatPrice, SHIPPING_INSURANCE_CENTS } from "@/lib/format";

export const metadata = { title: "Shipping & Returns" };

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-(family-name:--font-display) text-3xl">
        Shipping &amp; Returns
      </h1>

      <div className="mt-8 space-y-8 text-sm">
        <section>
          <h2 className="font-medium">Shipping</h2>
          <p className="mt-2 text-muted-foreground">
            Shipping is free on every order within the United States. Orders
            ship within 3 business days of payment — every item is
            authenticated before it&apos;s ever listed, so there&apos;s no additional
            wait for verification after you buy. You&apos;ll receive tracking by
            email as soon as your order ships. At checkout you can add
            optional shipping insurance for {formatPrice(SHIPPING_INSURANCE_CENTS)},
            which covers the full value of your item against loss or damage
            in transit. We currently ship within the US only.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Returns</h2>
          <p className="mt-2 text-muted-foreground">
            Because every piece is one-of-one, we offer a 3-day return
            window from the date of delivery. To be eligible, an item must
            be unworn and unused, with all original tags, dust bags, and
            authentication documentation included, and it must pass
            re-authentication once we receive it back.
          </p>
          <p className="mt-2 text-muted-foreground">
            Return shipping is the buyer&apos;s responsibility unless the item
            arrives significantly not as described or fails
            re-authentication — in that case, PongoLux covers return
            shipping and refunds the full purchase price, including any
            shipping insurance paid. Approved refunds are issued to the
            original payment method within 3–5 business days of us
            receiving and re-authenticating the returned item.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Questions</h2>
          <p className="mt-2 text-muted-foreground">
            Reach us at{" "}
            <a href="mailto:support@pongolux.com" className="text-foreground hover:text-accent">
              support@pongolux.com
            </a>{" "}
            or{" "}
            <a href="tel:+13127740792" className="text-foreground hover:text-accent">
              (312) 774-0792
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
