"use server";

import { put, del } from "@vercel/blob";
import { db } from "@/db";
import { products, productImages, authenticationRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getNextImagePosition } from "@/lib/admin-data";
import {
  ProductFormSchema,
  PRODUCT_STATUSES,
} from "@/lib/validations";
import { z } from "zod";

export type ProductActionState = { error: string | null } | null;

function fieldsFromFormData(formData: FormData) {
  return {
    sku: formData.get("sku"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    title: formData.get("title"),
    description: formData.get("description"),
    conditionNotes: formData.get("conditionNotes"),
    dimensions: formData.get("dimensions"),
    color: formData.get("color"),
    category: formData.get("category"),
    condition: formData.get("condition"),
    priceUsd: formData.get("priceUsd"),
    compareAtPriceUsd: formData.get("compareAtPriceUsd"),
    isConsignment: formData.get("isConsignment") === "on",
    isMostWanted: formData.get("isMostWanted") === "on",
    authMethod: formData.get("authMethod"),
    authenticatedBy: formData.get("authenticatedBy"),
  };
}

/** Uploads every non-empty file under the "images" field to Vercel Blob
 * storage, returning their public URLs in the order they were selected.
 * Vercel's serverless functions have a read-only filesystem, so listing
 * photos can't just write into /public the way the CLI import script does
 * for the initial catalog — this is the runtime-safe equivalent. */
async function uploadImages(sku: string, formData: FormData) {
  const files = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);

  const urls: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`"${file.name}" isn't an image file.`);
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blob = await put(
      `products/${sku}/${crypto.randomUUID()}-${safeName}`,
      file,
      { access: "public" }
    );
    urls.push(blob.url);
  }
  return urls;
}

function isUniqueViolation(err: unknown, column: "sku" | "title") {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as { code?: string }).code === "23505" &&
    err.message.includes(column)
  );
}

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireAdmin();

  const parsed = ProductFormSchema.safeParse(fieldsFromFormData(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const [existingSku] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sku, data.sku))
    .limit(1);
  if (existingSku) {
    return { error: `SKU "${data.sku}" is already in use.` };
  }

  let imageUrls: string[];
  try {
    imageUrls = await uploadImages(data.sku, formData);
  } catch (err) {
    console.error("Admin product image upload failed", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Couldn't upload one of the photos. Make sure Vercel Blob storage is set up (BLOB_READ_WRITE_TOKEN).",
    };
  }
  if (imageUrls.length === 0) {
    return { error: "Add at least one photo." };
  }

  let productId: string;
  try {
    const [product] = await db
      .insert(products)
      .values({
        sku: data.sku,
        brand: data.brand,
        model: data.model,
        title: data.title,
        description: data.description,
        conditionNotes: data.conditionNotes,
        dimensions: data.dimensions,
        color: data.color,
        category: data.category,
        condition: data.condition,
        priceCents: Math.round(data.priceUsd * 100),
        compareAtPriceCents:
          data.compareAtPriceUsd == null
            ? null
            : Math.round(data.compareAtPriceUsd * 100),
        isConsignment: data.isConsignment,
        isMostWanted: data.isMostWanted,
      })
      .returning({ id: products.id });
    productId = product.id;
  } catch (err) {
    if (isUniqueViolation(err, "title")) {
      return {
        error: `A listing titled "${data.title}" already exists — add a distinguishing detail.`,
      };
    }
    console.error("Admin product creation failed", err);
    return { error: "Couldn't save this listing. Please try again." };
  }

  await db.insert(productImages).values(
    imageUrls.map((url, position) => ({
      productId,
      url,
      alt: `${data.brand} ${data.title}`,
      position,
    }))
  );

  await db.insert(authenticationRecords).values({
    productId,
    method: data.authMethod,
    authenticatedBy: data.authenticatedBy,
  });

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

const ProductEditSchema = ProductFormSchema.omit({ sku: true }).extend({
  status: z.enum(PRODUCT_STATUSES),
});

export async function updateProductAction(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireAdmin();

  const parsed = ProductEditSchema.safeParse({
    ...fieldsFromFormData(formData),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const [existing] = await db
    .select({ sku: products.sku })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!existing) {
    return { error: "This listing no longer exists." };
  }

  let newImageUrls: string[];
  try {
    newImageUrls = await uploadImages(existing.sku, formData);
  } catch (err) {
    console.error("Admin product image upload failed", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Couldn't upload one of the new photos.",
    };
  }

  try {
    await db
      .update(products)
      .set({
        brand: data.brand,
        model: data.model,
        title: data.title,
        description: data.description,
        conditionNotes: data.conditionNotes,
        dimensions: data.dimensions,
        color: data.color,
        category: data.category,
        condition: data.condition,
        priceCents: Math.round(data.priceUsd * 100),
        compareAtPriceCents:
          data.compareAtPriceUsd == null
            ? null
            : Math.round(data.compareAtPriceUsd * 100),
        isConsignment: data.isConsignment,
        isMostWanted: data.isMostWanted,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));
  } catch (err) {
    if (isUniqueViolation(err, "title")) {
      return {
        error: `A listing titled "${data.title}" already exists — add a distinguishing detail.`,
      };
    }
    console.error("Admin product update failed", err);
    return { error: "Couldn't save these changes. Please try again." };
  }

  if (newImageUrls.length > 0) {
    const startPosition = await getNextImagePosition(productId);
    await db.insert(productImages).values(
      newImageUrls.map((url, i) => ({
        productId,
        url,
        alt: `${data.brand} ${data.title}`,
        position: startPosition + i,
      }))
    );
  }

  const [existingAuth] = await db
    .select({ id: authenticationRecords.id })
    .from(authenticationRecords)
    .where(eq(authenticationRecords.productId, productId))
    .limit(1);
  if (existingAuth) {
    await db
      .update(authenticationRecords)
      .set({ method: data.authMethod, authenticatedBy: data.authenticatedBy })
      .where(eq(authenticationRecords.productId, productId));
  } else {
    await db.insert(authenticationRecords).values({
      productId,
      method: data.authMethod,
      authenticatedBy: data.authenticatedBy,
    });
  }

  revalidatePath("/shop");
  revalidatePath(`/product/${existing.sku}`);
  revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}/edit?saved=1`);
}

/** Quick status toggle from the product list — no full edit form needed. */
export async function setProductStatusAction(
  productId: string,
  status: (typeof PRODUCT_STATUSES)[number]
) {
  await requireAdmin();
  await db
    .update(products)
    .set({ status, updatedAt: new Date() })
    .where(eq(products.id, productId));
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}

export async function deleteProductImageAction(
  imageId: string,
  productId: string
) {
  await requireAdmin();
  const [image] = await db
    .select({ url: productImages.url })
    .from(productImages)
    .where(eq(productImages.id, imageId))
    .limit(1);
  await db.delete(productImages).where(eq(productImages.id, imageId));
  if (image?.url) {
    try {
      await del(image.url);
    } catch (err) {
      // Not fatal — the DB row is already gone, which is what actually
      // controls whether it shows on the site. A stray blob can be cleaned
      // up later from the Vercel dashboard.
      console.error("Failed to delete blob for removed product image", err);
    }
  }
  revalidatePath(`/admin/products/${productId}/edit`);
}
