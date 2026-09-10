import { notFound } from "next/navigation";
import { getProductForAdmin } from "@/lib/admin-data";
import { updateProductAction } from "@/lib/actions/admin-products";
import { ProductForm } from "@/components/admin/product-form";
import { EbayListingPanel } from "@/components/admin/ebay-listing-panel";
import { getEbayListingForProduct, isEbayConnected } from "@/lib/ebay";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductForAdmin(id);
  if (!product) notFound();

  const [ebayListing, ebayConnected] = await Promise.all([
    getEbayListingForProduct(id),
    isEbayConnected(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-(family-name:--font-display) text-3xl">
        Edit listing
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {product.brand} {product.title}
      </p>

      <ProductForm
        mode="edit"
        productId={product.id}
        action={updateProductAction.bind(null, product.id)}
        initialValues={{
          sku: product.sku,
          brand: product.brand,
          model: product.model,
          title: product.title,
          description: product.description,
          conditionNotes: product.conditionNotes ?? "",
          dimensions: product.dimensions ?? "",
          color: product.color,
          category: product.category,
          condition: product.condition,
          priceUsd: (product.priceCents / 100).toFixed(2),
          compareAtPriceUsd:
            product.compareAtPriceCents != null
              ? (product.compareAtPriceCents / 100).toFixed(2)
              : "",
          isConsignment: product.isConsignment,
          isMostWanted: product.isMostWanted,
          status: product.status,
          authMethod: product.authentication?.method ?? "entrupy",
          authenticatedBy:
            product.authentication?.authenticatedBy ??
            "PongoLux Authentication Team",
          certificateUrl: product.authentication?.certificateUrl ?? "",
        }}
        existingImages={product.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
        }))}
      />

      <EbayListingPanel
        productId={product.id}
        listing={ebayListing}
        ebayConnected={ebayConnected}
      />
    </div>
  );
}
