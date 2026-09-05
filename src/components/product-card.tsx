import Link from "next/link";
import Image from "next/image";
import { formatPrice, CONDITION_LABELS } from "@/lib/format";
import type { ProductListItem } from "@/lib/types";

export function ProductCard({ product }: { product: ProductListItem }) {
  const sold = product.status === "sold";

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block"
      aria-disabled={sold}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={`${product.brand} ${product.title}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide">
              Sold
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {product.brand}
        </div>
        <div className="text-sm font-medium">{product.title}</div>
        <div className="flex items-center justify-between text-sm">
          <span>{formatPrice(product.priceCents, product.currency)}</span>
          <span className="text-xs text-muted-foreground">
            {CONDITION_LABELS[product.condition] ?? product.condition}
          </span>
        </div>
      </div>
    </Link>
  );
}
