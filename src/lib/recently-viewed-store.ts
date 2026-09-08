"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductListItem } from "@/lib/types";

const MAX_ITEMS = 8;

type RecentlyViewedState = {
  items: ProductListItem[];
  record: (item: ProductListItem) => void;
};

/**
 * Client-only browsing history, same pattern as the cart store (Zustand +
 * persist, no account/DB involved) — this is purely a per-browser
 * convenience, not something that needs to sync across devices. Newest
 * first, capped at MAX_ITEMS, de-duped by product id so re-viewing an item
 * just bumps it back to the front instead of appearing twice.
 */
export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],
      record: (item) => {
        const rest = get().items.filter((i) => i.id !== item.id);
        set({ items: [item, ...rest].slice(0, MAX_ITEMS) });
      },
    }),
    { name: "pongolux-recently-viewed-v1" }
  )
);
