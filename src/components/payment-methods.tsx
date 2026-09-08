/** Cosmetic "accepted payment methods" strip — trust signaling only, not a
 * BNPL integration. Only lists what Checkout actually accepts today (major
 * card networks via Stripe). Do NOT add Klarna/Afterpay/Affirm/PayPal here
 * unless those are actually enabled in the Stripe Dashboard and the
 * required financing disclosures are added alongside them. Badges are
 * simple text marks in each brand's associated color rather than the
 * brands' actual logo marks. */

const CARD_BADGES: { label: string; bg: string; fg: string }[] = [
  { label: "VISA", bg: "#1a1f71", fg: "#ffffff" },
  { label: "Mastercard", bg: "#000000", fg: "#ffffff" },
  { label: "Amex", bg: "#006fcf", fg: "#ffffff" },
  { label: "Discover", bg: "#f57c22", fg: "#ffffff" },
];

export function PaymentMethods() {
  return (
    <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-4">
      <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
        We accept
      </span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {CARD_BADGES.map(({ label, bg, fg }) => (
          <span
            key={label}
            className="flex h-7 items-center rounded px-3 text-[11px] font-semibold tracking-wide"
            style={{ backgroundColor: bg, color: fg }}
          >
            {label}
          </span>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        Secure checkout powered by Stripe
      </span>
    </div>
  );
}
