export const metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of the PongoLux website and purchases.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-(family-name:--font-display) text-3xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated September 2026. This is a first draft, not yet reviewed
        by a lawyer — treat it as a good-faith starting point rather than
        final legal text.
      </p>

      <div className="mt-8 space-y-8 text-sm">
        <section>
          <h2 className="font-medium">About PongoLux</h2>
          <p className="mt-2 text-muted-foreground">
            PongoLux LLC ("PongoLux," "we," "us") is a US-based reseller of
            pre-owned designer handbags, based in Chicago, Illinois. By using
            this site or placing an order, you agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Product listings &amp; authenticity</h2>
          <p className="mt-2 text-muted-foreground">
            Every item is one-of-one and independently authenticated before
            it's listed (see our{" "}
            <a href="/#authentication" className="text-foreground hover:text-accent">
              authentication process
            </a>
            ). Because each piece is unique, once an item sells or is
            reserved by another customer's cart, it's no longer available —
            we make no guarantee that any specific listed item will remain
            available until your order is placed. Photos and condition
            notes are provided in good faith to accurately represent each
            item's actual, pre-owned condition.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Reservations</h2>
          <p className="mt-2 text-muted-foreground">
            Adding an item to your cart holds it for 15 minutes. If checkout
            isn't completed within that window, the hold expires and the
            item becomes available to other shoppers again.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Pricing &amp; payment</h2>
          <p className="mt-2 text-muted-foreground">
            All prices are listed in US dollars. Payment is processed
            securely through Stripe at checkout. We reserve the right to
            correct listing errors (including pricing errors) before an
            order is confirmed.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Shipping &amp; returns</h2>
          <p className="mt-2 text-muted-foreground">
            See our{" "}
            <a href="/shipping-returns" className="text-foreground hover:text-accent">
              Shipping &amp; Returns
            </a>{" "}
            page for full details on delivery times, the return window, and
            our re-authentication requirement on returns.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Limitation of liability</h2>
          <p className="mt-2 text-muted-foreground">
            PongoLux's liability for any claim related to a purchase is
            limited to the amount paid for that item. We aren't liable for
            indirect or incidental damages arising from use of this site or
            a purchased item.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Changes to these terms</h2>
          <p className="mt-2 text-muted-foreground">
            We may update these terms from time to time; the "last updated"
            date above will reflect the most recent revision. Continued use
            of the site after a change means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Governing law</h2>
          <p className="mt-2 text-muted-foreground">
            These terms are governed by the laws of the State of Illinois,
            without regard to conflict-of-law principles.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Questions</h2>
          <p className="mt-2 text-muted-foreground">
            Reach us at{" "}
            <a
              href="mailto:support@pongolux.com"
              className="text-foreground hover:text-accent"
            >
              support@pongolux.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
