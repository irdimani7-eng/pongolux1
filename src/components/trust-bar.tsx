import { ShieldCheck, Gem, Truck, RotateCcw, Lock } from "lucide-react";
import type { ComponentType } from "react";

const TRUST_ITEMS: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  detail: string;
}[] = [
  {
    icon: ShieldCheck,
    title: "Authenticity Guaranteed",
    detail: "Every piece verified by Entrupy plus a hands-on expert review",
  },
  {
    icon: Gem,
    title: "One-of-a-Kind Pieces",
    detail: "Each item is a single, unique find — once it's sold, it's gone",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    detail: "On every order, ships within 3 business days",
  },
  {
    icon: RotateCcw,
    title: "3-Day Return Policy",
    detail: "Shop with confidence",
  },
  {
    icon: Lock,
    title: "Secure Checkout",
    detail: "Payments processed securely by Stripe",
  },
];

/** Homepage trust bar, styled after a common resale-industry pattern
 * (icon row + short claims) but built entirely from PongoLux's own real
 * policies — see /shipping-returns and /about for the source of truth
 * each of these lines has to stay in sync with. */
export function TrustBar() {
  return (
    <section className="border-y border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-14 text-center">
        <h2 className="font-(family-name:--font-display) text-2xl">
          Luxury You Can Trust
        </h2>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Authenticated. Curated. Delivered.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {TRUST_ITEMS.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="flex flex-col items-center px-2">
              <div className="flex size-14 items-center justify-center rounded-full border border-border bg-surface">
                <Icon className="size-6 text-accent" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-sm font-medium uppercase tracking-wide">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
