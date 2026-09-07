import { ProductCard } from "@/components/product-card";
import { ShopFilterBar } from "@/components/shop-filter-bar";
import { HeroBanner } from "@/components/hero-banner";
import { listProducts, getFilterOptions } from "@/lib/products";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import type { ShopFilters } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Handbags",
  description:
    "Browse authenticated, pre-owned designer handbags from Chanel, Louis Vuitton, Gucci, Hermès, and more — filter by brand, type, color, condition, and price.",
};

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
  };

  const [products, options] = await Promise.all([
    listProducts(filters),
    getFilterOptions(),
  ]);

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
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
