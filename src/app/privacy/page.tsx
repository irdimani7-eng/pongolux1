export const metadata = {
  title: "Privacy Policy",
  description:
    "How PongoLux collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-(family-name:--font-display) text-3xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated September 2026. This is a first draft, not yet reviewed
        by a lawyer — treat it as a good-faith starting point rather than
        final legal text.
      </p>

      <div className="mt-8 space-y-8 text-sm">
        <section>
          <h2 className="font-medium">Information we collect</h2>
          <p className="mt-2 text-muted-foreground">
            When you create an account, we collect your name and email
            address. When you place an order, our payment processor, Stripe,
            collects your payment details directly — PongoLux never sees or
            stores your full card number. Stripe also collects the shipping
            address you enter at checkout, which we store to fulfill your
            order. If you use the contact form, we collect whatever name,
            email, and message you choose to send us.
          </p>
        </section>

        <section>
          <h2 className="font-medium">How we use it</h2>
          <p className="mt-2 text-muted-foreground">
            We use your information to process and ship orders, send order
            and shipping confirmation emails, respond to questions sent
            through the contact form, and maintain your account and order
            history. We do not sell your personal information to anyone.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Analytics</h2>
          <p className="mt-2 text-muted-foreground">
            We use Vercel Analytics to understand how visitors use our site
            (which pages are viewed, general traffic patterns). It's
            designed to work without setting tracking cookies and doesn't
            collect personally identifying information.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Third parties we work with</h2>
          <p className="mt-2 text-muted-foreground">
            Stripe (payment processing), Resend (transactional email — order
            confirmations, shipping updates, and contact form messages), and
            Vercel (hosting and analytics). Each handles data under its own
            privacy policy.
          </p>
        </section>

        <section>
          <h2 className="font-medium">Your choices</h2>
          <p className="mt-2 text-muted-foreground">
            You can request a copy of the personal information we hold about
            you, ask us to correct it, or ask us to delete your account and
            associated data (subject to what we're legally required to keep
            for tax/accounting purposes) by emailing us at the address
            below.
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
            </a>{" "}
            with any privacy questions or requests.
          </p>
        </section>
      </div>
    </div>
  );
}
