import { notFound } from "next/navigation";
import { getProductBySku, getRelatedProducts, isOnSale } from "@/lib/products";
import { formatPrice, CONDITION_LABELS, AUTH_METHOD_LABELS } from "@/lib/format";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { WishlistButton } from "@/components/wishlist-button";
import { RecentlyViewedTracker } from "@/components/recently-viewed-tracker";
import { RecentlyViewed } from "@/components/recently-viewed";
import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: PageProps<"/product/[sku]">): Promise<Metadata> {
  const { sku } = await params;
  const product = await getProductBySku(sku);
  if (!product) return {};
  const title = `${product.brand} ${product.title}`;
  const description = product.description.slice(0, 155);
  const image = product.images[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.sku}` },
    openGraph: {
      type: "website",
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

/** Maps our internal one-of-one status to schema.org's ItemAvailability
 * vocabulary for the Product JSON-LD below. "reserved" (a 15-minute cart
 * hold) is treated as LimitedAvailability rather than InStock, since it
 * genuinely can't be bought by someone else right now. */
function schemaAvailability(status: string) {
  switch (status) {
    case "available":
      return "https://schema.org/InStock";
    case "reserved":
      return "https://schema.org/LimitedAvailability";
    default:
      return "https://schema.org/OutOfStock";
  }
}

export default async function ProductPage({
  params,
}: PageProps<"/product/[sku]">) {
  const { sku } = await params;
  const product = await getProductBySku(sku);
  if (!product) notFound();
  const onSale = product.status !== "sold" && isOnSale(product);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // Bulk-imported photos are stored as relative /products/<sku>/N.webp
  // paths (served from /public); admin-uploaded ones are already full
  // Vercel Blob URLs. JSON-LD (and Open Graph) images should be absolute
  // either way.
  const absoluteImageUrl = (url: string) =>
    url.startsWith("http") ? url : `${siteUrl}${url}`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.title}`,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    image: product.images.map((img) => absoluteImageUrl(img.url)),
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.sku}`,
      priceCurrency: product.currency,
      price: (product.priceCents / 100).toFixed(2),
      availability: schemaAvailability(product.status),
      itemCondition: "https://schema.org/UsedCondition",
    },
  };

  const related = await getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.brand, href: `/shop?brand=${encodeURIComponent(product.brand)}` },
          { label: product.title },
        ]}
      />
      <RecentlyViewedTracker product={product} />

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

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1">
              <AddToCartButton product={product} />
            </div>
            <WishlistButton productId={product.id} variant="labeled" />
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

      {related.length > 0 && (
        <div className="mt-20 border-t border-border pt-12">
          <h2 className="mb-6 font-(family-name:--font-display) text-2xl">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      <RecentlyViewed excludeProductId={product.id} />
    </div>
  );
}
