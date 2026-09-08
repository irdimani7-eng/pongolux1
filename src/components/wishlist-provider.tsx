"use client";

import {
  createContext,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toggleWishlistAction } from "@/lib/actions/wishlist";

type WishlistContextValue = {
  isSaved: (productId: string) => boolean;
  toggle: (productId: string) => void;
  pending: boolean;
  count: number;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Site-wide wishlist state, seeded once from the server (see layout.tsx,
 * which reads the signed-in shopper's saved product IDs) so every
 * WishlistButton anywhere on the page — product cards, the product detail
 * page — lights up correctly on first paint with no extra client fetch.
 * Toggling is optimistic: the heart flips immediately, then the server
 * action confirms in the background and rolls back on failure (including
 * a signed-out click, which redirects to /login instead).
 */
export function WishlistProvider({
  initialIds,
  signedIn,
  children,
}: {
  initialIds: string[];
  signedIn: boolean;
  children: ReactNode;
}) {
  const [ids, setIds] = useState<Set<string>>(() => new Set(initialIds));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const flip = (productId: string) =>
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });

  const toggle = (productId: string) => {
    if (!signedIn) {
      router.push("/login");
      return;
    }

    flip(productId); // optimistic

    startTransition(async () => {
      try {
        const result = await toggleWishlistAction(productId);
        if (!result.ok) {
          flip(productId); // revert — toggling again cancels the optimistic flip either way
          if (result.message === "sign_in_required") router.push("/login");
        }
      } catch (err) {
        // The server action itself threw (e.g. a DB error) rather than
        // returning { ok: false } — still revert the optimistic flip so a
        // failed save doesn't look like it silently succeeded.
        console.error("Wishlist toggle failed:", err);
        flip(productId);
      }
    });
  };

  return (
    <WishlistContext.Provider
      value={{
        isSaved: (id) => ids.has(id),
        toggle,
        pending: isPending,
        count: ids.size,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
}
