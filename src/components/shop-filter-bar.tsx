"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { CATEGORY_LABELS, CONDITION_LABELS, PRICE_RANGES } from "@/lib/format";
import type { FilterOptions, ShopFilters } from "@/lib/types";

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS);
const CONDITION_OPTIONS = Object.entries(CONDITION_LABELS);

export function ShopFilterBar({
  options,
  current,
}: {
  options: FilterOptions;
  current: ShopFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setFilter(key: keyof ShopFilters, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasActiveFilters = Object.values(current).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={current.search ?? ""}
        onChange={(v) => setFilter("search", v)}
      />
      <FilterSelect
        label="Brand"
        value={current.brand ?? ""}
        onChange={(v) => setFilter("brand", v)}
        options={options.brands.map((b) => [b, b])}
      />
      <FilterSelect
        label="Type"
        value={current.category ?? ""}
        onChange={(v) => setFilter("category", v)}
        options={CATEGORY_OPTIONS}
      />
      <FilterSelect
        label="Color"
        value={current.color ?? ""}
        onChange={(v) => setFilter("color", v)}
        options={options.colors.map((c) => [c, c])}
      />
      <FilterSelect
        label="Condition"
        value={current.condition ?? ""}
        onChange={(v) => setFilter("condition", v)}
        options={CONDITION_OPTIONS}
      />
      <FilterSelect
        label="Price"
        value={current.priceRange ?? ""}
        onChange={(v) => setFilter("priceRange", v)}
        options={PRICE_RANGES.map((r) => [r.value, r.label])}
      />
      {hasActiveFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="text-sm text-muted-foreground underline hover:text-accent"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value: selected,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="text-sm">
      <span className="sr-only">{label}</span>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm"
      >
        <option value="">{label}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Free-text search — debounced so it doesn't push a new URL (and re-run
 * the product query) on every keystroke, only ~350ms after typing stops. */
function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  // Tracks the last external `value` we've synced from, so a change made
  // elsewhere (e.g. "Clear filters" navigating away) is picked up — done
  // during render rather than in an effect, per React's guidance for
  // adjusting state from a prop change without an extra render/effect.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const timeout = setTimeout(() => onChange(draft), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <label className="relative">
      <span className="sr-only">Search</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.5}
      />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search brand or model…"
        className="rounded-full border border-border bg-surface py-1.5 pl-9 pr-4 text-sm"
      />
    </label>
  );
}
