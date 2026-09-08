"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/components/wishlist-provider";

/** Header entry point for the wishlist, next to the cart icon — links to
 * the "Saved items" section of /account. Only rendered for signed-in
 * shoppers (see site-header.tsx); a signed-out visitor has nothing saved
 * yet, since wishlist items are account-scoped. */
export function WishlistBadge() {
  const { count } = useWishlist();

  return (
    <Link
      href="/account#saved-items"
      className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-muted transition-colors"
      aria-label="View wishlist"
    >
      <Heart className="size-5" strokeWidth={1.5} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
