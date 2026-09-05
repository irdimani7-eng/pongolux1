import { db } from "@/db";
import { products, productImages, authenticationRecords } from "@/db/schema";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import type { ProductDetail, ProductListItem } from "@/lib/types";

async function primaryImageUrl(productId: string) {
  const [image] = await db
    .select({ url: productImages.url })
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.position))
    .limit(1);
  return image?.url ?? null;
}

export async function listProducts(filters?: {
  category?: string;
  brand?: string;
  includeSold?: boolean;
}): Promise<ProductListItem[]> {
  const conditions = [
    filters?.includeSold ? undefined : ne(products.status, "archived"),
    filters?.category ? eq(products.category, filters.category as never) : undefined,
    filters?.brand ? eq(products.brand, filters.brand) : undefined,
  ].filter((c): c is NonNullable<typeof c> => Boolean(c));

  const rows = await db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(products.createdAt));

  return Promise.all(
    rows.map(async (product) => ({
      id: product.id,
      slug: product.slug,
      brand: product.brand,
      model: product.model,
      title: product.title,
      condition: product.condition,
      priceCents: product.priceCents,
      currency: product.currency,
      status: product.status,
      imageUrl: await primaryImageUrl(product.id),
    }))
  );
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (!product) return null;

  const images = await db
    .select({ url: productImages.url, alt: productImages.alt })
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.position));

  const [auth] = await db
    .select({
      method: authenticationRecords.method,
      authenticatedBy: authenticationRecords.authenticatedBy,
      certificateUrl: authenticationRecords.certificateUrl,
    })
    .from(authenticationRecords)
    .where(eq(authenticationRecords.productId, product.id))
    .limit(1);

  return {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    model: product.model,
    title: product.title,
    description: product.description,
    category: product.category,
    condition: product.condition,
    priceCents: product.priceCents,
    currency: product.currency,
    status: product.status,
    isConsignment: product.isConsignment,
    imageUrl: images[0]?.url ?? null,
    images,
    authentication: auth ?? null,
  };
}
