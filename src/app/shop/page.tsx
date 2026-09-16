import { ProductCard } from "@/components/product-card";
import { ShopFilterBar } from "@/components/shop-filter-bar";
import { HeroBanner } from "@/components/hero-banner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/pagination";
import { listProducts, countProducts, getFilterOptions } from "@/lib/products";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import type { ShopFilters } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Handbags",
  description:
    "Browse authenticated, pre-owned designer handbags from Chanel, Louis Vuitton, Gucci, Hermès, and more — filter by brand, type, color, condition, and price.",
};

// 24 divides evenly into the 2/3/4-column grid at every breakpoint, so a
// full page never ends on a lopsided row. Fine at today's catalog size —
// this is here so /shop stays fast and navigable once the catalog grows
// well past what fits comfortably on one page.
const PRODUCTS_PER_PAGE = 24;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShopPage({
  searchParams,
}: PageProps<"/shop">) {
  const params = await searchParams;
  const filters: ShopFilters = {
    brand: firstValue(params.brand),
    category: firstValue(params.category),
    color: firstValue(params.color),
    condition: firstValue(params.condition),
    priceRange: firstValue(params.priceRange),
    search: firstValue(params.search),
  };
  const requestedPage = Number(firstValue(params.page));
  const page =
    Number.isFinite(requestedPage) && requestedPage > 1 ? Math.floor(requestedPage) : 1;

  const [total, options] = await Promise.all([
    countProducts(filters),
    getFilterOptions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
  // A stale/hand-edited ?page= beyond the last real page falls back to the
  // last page instead of rendering an empty grid.
  const effectivePage = Math.min(page, totalPages);

  const products = await listProducts({
    ...filters,
    limit: PRODUCTS_PER_PAGE,
    offset: (effectivePage - 1) * PRODUCTS_PER_PAGE,
  });

  function pageHref(targetPage: number) {
    const search = new URLSearchParams();
    if (filters.brand) search.set("brand", filters.brand);
    if (filters.category) search.set("category", filters.category);
    if (filters.color) search.set("color", filters.color);
    if (filters.condition) search.set("condition", filters.condition);
    if (filters.priceRange) search.set("priceRange", filters.priceRange);
    if (filters.search) search.set("search", filters.search);
    if (targetPage > 1) search.set("page", String(targetPage));
    const qs = search.toString();
    return qs ? `/shop?${qs}` : "/shop";
  }

  // No matches for the current filters — show a few other available pieces
  // instead of leaving the page empty, so the visit isn't a dead end.
  const suggestions =
    products.length === 0
      ? (await listProducts({ excludeSold: true })).slice(0, 4)
      : [];

  return (
    <div>
      <HeroBanner
        imageSrc={MARKETING_IMAGES.shopBanner.src}
        imageAlt={MARKETING_IMAGES.shopBanner.alt}
        eyebrow="The collection"
        title="Shop the collection"
        subtitle="Every piece is a unique, independently authenticated find — once it's gone, it's gone."
        size="compact"
      />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
        <ShopFilterBar options={options} current={filters} />

        {products.length === 0 ? (
          <div className="mt-16">
            <p className="text-center text-muted-foreground">
              No items match those filters yet — try clearing one, or check
              back soon as new pieces are added regularly.
            </p>
            {suggestions.length > 0 && (
              <div className="mt-10">
                <h2 className="text-center text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  You might like
                </h2>
                <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                  {suggestions.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination page={effectivePage} totalPages={totalPages} buildHref={pageHref} />
          </>
        )}
      </div>
    </div>
  );
}
