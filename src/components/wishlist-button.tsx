"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/components/wishlist-provider";

/**
 * `variant="icon"` is the compact circular badge used as an overlay on
 * ProductCard photos; `variant="labeled"` is the fuller button used on the
 * product detail page next to Add to Cart.
 */
export function WishlistButton({
  productId,
  variant = "icon",
  className = "",
}: {
  productId: string;
  variant?: "icon" | "labeled";
  className?: string;
}) {
  const { isSaved, toggle, pending } = useWishlist();
  const saved = isSaved(productId);

  if (variant === "labeled") {
    return (
      <button
        type="button"
        onClick={() => toggle(productId)}
        aria-pressed={saved}
        disabled={pending}
        className={`inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm transition hover:border-foreground disabled:opacity-60 ${className}`}
      >
        <Heart
          className={saved ? "size-4 fill-danger text-danger" : "size-4"}
          strokeWidth={1.5}
        />
        {saved ? "Saved" : "Save for later"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={`flex size-8 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition hover:scale-105 ${className}`}
    >
      <Heart
        className={saved ? "size-4 fill-danger text-danger" : "size-4"}
        strokeWidth={1.5}
      />
    </button>
  );
}
