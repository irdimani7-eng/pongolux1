import { Truck, RotateCcw, Lock } from "lucide-react";
import type { ComponentType } from "react";

const ITEMS: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}[] = [
  { icon: Truck, label: "Free shipping" },
  { icon: RotateCcw, label: "3-day returns" },
  { icon: Lock, label: "Secure checkout" },
];

/**
 * A compact reassurance strip for the exact moment someone is deciding
 * whether to commit — right by Add to Cart on the product page, and right
 * by Proceed to Checkout on the cart page. The full policy explanations
 * already live on the homepage TrustBar and /shipping-returns /
 * /authenticity; this is deliberately terse (three short claims, small
 * icons) since its job is reassurance at a glance, not re-explaining
 * anything. Kept in sync with the same real policies as TrustBar — if one
 * changes, check the other.
 */
export function CheckoutTrustStrip({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground ${className}`}
    >
      {ITEMS.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-1.5">
          <Icon className="size-3.5 shrink-0 text-accent" strokeWidth={1.75} />
          {label}
        </li>
      ))}
    </ul>
  );
}
