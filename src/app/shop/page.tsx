import { ProductCard } from "@/components/product-card";
import { ShopFilterBar } from "@/components/shop-filter-bar";
import { listProducts, getFilterOptions } from "@/lib/products";
import type { ShopFilters } from "@/lib/types";

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
    listProducts({ ...filters, includeSold: true }),
    getFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-(family-name:--font-display) text-3xl">
        Shop the collection
      </h1>

      <div className="mt-6">
        <ShopFilterBar options={options} current={filters} />
      </div>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          No items match those filters yet — try clearing one, or check back
          soon as new pieces are added regularly.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
