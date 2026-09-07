import { notFound } from "next/navigation";
import { getProductBySku, isOnSale } from "@/lib/products";
import { formatPrice, CONDITION_LABELS, AUTH_METHOD_LABELS } from "@/lib/format";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductGallery } from "@/components/product-gallery";
import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: PageProps<"/product/[sku]">): Promise<Metadata> {
  const { sku } = await params;
  const product = await getProductBySku(sku);
  if (!product) return {};
  return {
    title: `${product.brand} ${product.title}`,
    description: product.description.slice(0, 155),
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/product/[sku]">) {
  const { sku } = await params;
  const product = await getProductBySku(sku);
  if (!product) notFound();
  const onSale = product.status !== "sold" && isOnSale(product);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          fallbackAlt={`${product.brand} ${product.title}`}
        />

        <div>
          <div className="text-sm uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </div>
          <h1 className="mt-1 font-(family-name:--font-display) text-3xl">
            {product.title}
          </h1>
          <div className="mt-4 flex items-baseline gap-3 text-2xl">
            <span>{formatPrice(product.priceCents, product.currency)}</span>
            {onSale && (
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(product.compareAtPriceCents!, product.currency)}
              </span>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Condition</dt>
            <dd>{CONDITION_LABELS[product.condition] ?? product.condition}</dd>
            <dt className="text-muted-foreground">Model</dt>
            <dd>{product.model}</dd>
            <dt className="text-muted-foreground">Color</dt>
            <dd>{product.color}</dd>
            <dt className="text-muted-foreground">SKU</dt>
            <dd>{product.sku}</dd>
            {product.isConsignment && (
              <>
                <dt className="text-muted-foreground">Listing type</dt>
                <dd>Consignment</dd>
              </>
            )}
          </dl>

          <div className="mt-6">
            <AddToCartButton product={product} />
          </div>

          {product.authentication && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.5} />
              <div>
                <p className="font-medium">Authenticity verified</p>
                <p className="mt-0.5 text-muted-foreground">
                  {product.authentication.method === "entrupy"
                    ? `Scanned and verified with Entrupy, then authenticated in-house by ${product.authentication.authenticatedBy}.`
                    : `Verified by ${
                        AUTH_METHOD_LABELS[product.authentication.method] ??
                        product.authentication.method
                      } (${product.authentication.authenticatedBy}).`}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-6 text-sm">
            <div>
              <h2 className="text-sm font-medium">Description</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {product.description}
              </p>
            </div>
            {product.conditionNotes && (
              <div>
                <h2 className="text-sm font-medium">Condition</h2>
                <p className="mt-2 whitespace-pre-line text-muted-foreground">
                  {product.conditionNotes}
                </p>
              </div>
            )}
            {product.dimensions && (
              <div>
                <h2 className="text-sm font-medium">Size</h2>
                <p className="mt-2 whitespace-pre-line text-muted-foreground">
                  {product.dimensions}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
