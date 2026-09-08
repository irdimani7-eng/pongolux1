"use client";

import { useSyncExternalStore } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useRecentlyViewedStore } from "@/lib/recently-viewed-store";

/**
 * Zustand's `persist` middleware reads localStorage after mount, so the
 * cart is empty on the very first client render (to match the server).
 * This tracks that hydration event via `useSyncExternalStore` rather than
 * the common `useState(false) + useEffect(() => setState(true))` pattern,
 * which triggers an avoidable extra render (and an eslint-plugin-react-hooks
 * `set-state-in-effect` warning).
 */
export function useCartHydrated() {
  return useSyncExternalStore(
    (callback) => useCartStore.persist.onFinishHydration(callback),
    () => useCartStore.persist.hasHydrated(),
    () => false
  );
}

/** Same hydration-guard pattern as useCartHydrated, for the "recently
 * viewed" store — avoids a server/client mismatch since that list also
 * only exists in localStorage. */
export function useRecentlyViewedHydrated() {
  return useSyncExternalStore(
    (callback) => useRecentlyViewedStore.persist.onFinishHydration(callback),
    () => useRecentlyViewedStore.persist.hasHydrated(),
    () => false
  );
}
