import { ProductCard } from "@/components/product-card";
import { listProducts } from "@/lib/products";
import Link from "next/link";
import clsx from "clsx";

const CATEGORIES = [
  { value: undefined, label: "All" },
  { value: "handbag", label: "Handbags" },
  { value: "wallet", label: "Wallets" },
  { value: "accessory", label: "Accessories" },
] as const;

export default async function ShopPage({
  searchParams,
}: PageProps<"/shop">) {
  const { category } = await searchParams;
  const activeCategory = Array.isArray(category) ? category[0] : category;

  const products = await listProducts({
    category: activeCategory,
    includeSold: true,
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-(family-name:--font-display) text-3xl">
        Shop the collection
      </h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.label}
            href={c.value ? `/shop?category=${c.value}` : "/shop"}
            className={clsx(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              activeCategory === c.value
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-muted"
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          Nothing here yet — check back soon, new pieces are added
          regularly.
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
