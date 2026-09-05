import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { formatPrice, CONDITION_LABELS, AUTH_METHOD_LABELS } from "@/lib/format";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.brand} ${product.title}`,
    description: product.description.slice(0, 155),
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          {(product.images.length > 0
            ? product.images
            : [{ url: "", alt: "" }]
          ).map((image, i) => (
            <div
              key={i}
              className={
                i === 0
                  ? "relative col-span-2 aspect-[4/5] overflow-hidden rounded-lg bg-muted"
                  : "relative aspect-square overflow-hidden rounded-lg bg-muted"
              }
            >
              {image.url ? (
                <Image
                  src={image.url}
                  alt={image.alt || `${product.brand} ${product.title}`}
                  fill
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  className="object-cover"
                  priority={i === 0}
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  No image yet
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <div className="text-sm uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </div>
          <h1 className="mt-1 font-(family-name:--font-display) text-3xl">
            {product.title}
          </h1>
          <div className="mt-4 text-2xl">
            {formatPrice(product.priceCents, product.currency)}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Condition</dt>
            <dd>{CONDITION_LABELS[product.condition] ?? product.condition}</dd>
            <dt className="text-muted-foreground">Model</dt>
            <dd>{product.model}</dd>
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
                  Verified by{" "}
                  {AUTH_METHOD_LABELS[product.authentication.method] ??
                    product.authentication.method}{" "}
                  ({product.authentication.authenticatedBy}).
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 whitespace-pre-line text-sm text-muted-foreground">
            {product.description}
          </div>
        </div>
      </div>
    </div>
  );
}
