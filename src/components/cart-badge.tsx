"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useCartHydrated } from "@/lib/use-hydrated";

export function CartBadge() {
  // Zustand's persisted store hydrates from localStorage after mount, so we
  // avoid rendering the count until then to prevent a server/client mismatch.
  const hydrated = useCartHydrated();
  const count = useCartStore((state) => state.items.length);

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-muted transition-colors"
      aria-label="View cart"
    >
      <ShoppingBag className="size-5" strokeWidth={1.5} />
      {hydrated && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
