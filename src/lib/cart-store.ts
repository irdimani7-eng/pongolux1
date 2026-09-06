"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  sku: string;
  title: string;
  brand: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

// Each handbag is one-of-one, so the cart is a set of distinct products
// rather than a quantity-per-line-item list — adding the same item twice is
// a no-op, not a quantity bump.
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        if (get().items.some((i) => i.productId === item.productId)) return;
        set({ items: [...get().items, item] });
      },
      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
      clear: () => set({ items: [] }),
    }),
    // Bumped from "pongolux-cart" when CartItem's `slug` field was renamed to
    // `sku` — avoids old browsers replaying a stale shape into this store.
    { name: "pongolux-cart-v2" }
  )
);
