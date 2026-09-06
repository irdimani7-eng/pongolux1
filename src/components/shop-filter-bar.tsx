"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
