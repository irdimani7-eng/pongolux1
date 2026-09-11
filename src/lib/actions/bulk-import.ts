"use server";

import { db } from "@/db";
import { products, productImages, authenticationRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { BulkImportRowSchema } from "@/lib/validations";
import { uploadImages } from "@/lib/actions/admin-products";
import { isUniqueViolation } from "@/lib/db-errors";
import { del } from "@vercel/blob";

export type BulkImportRowResult = {
  status: "created" | "updated" | "error";
  message: string;
};

/**
 * Publishes one row of the admin "Bulk import" tool
 * (src/components/admin/bulk-import-form.tsx) — one CSV row's fields plus
 * that SKU's matched photos, sent as a single FormData. Called directly
 * (not through useActionState) from a client-side loop that submits one row
 * at a time, so a batch of 50+ items uploads as 50+ small requests instead
 * of one huge one — well within the 25mb per-request Server Action limit
 * (see next.config.ts) that a single all-at-once submission would blow
 * past, and a network hiccup on one row only affects that row.
 *
 * Deliberately mirrors scripts/import-products.ts's "safe to re-run"
 * behavior: an existing SKU is updated in place (not duplicated), its
 * photos are fully replaced (old ones removed, including a best-effort
 * delete of their Blob storage), and its `status` is left untouched — a
 * re-import never accidentally un-sells or re-lists a sold item.
 */
export async function bulkImportRowAction(
  formData: FormData
): Promise<BulkImportRowResult> {
  await requireAdmin();

  const parsed = BulkImportRowSchema.safeParse({
    sku: formData.get("sku"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    title: formData.get("title"),
    description: formData.get("description"),
    conditionNotes: formData.get("conditionNotes"),
    dimensions: formData.get("dimensions"),
    category: formData.get("category"),
    color: formData.get("color"),
    condition: formData.get("condition"),
    priceUsd: formData.get("priceUsd"),
    compareAtPriceUsd: formData.get("compareAtPriceUsd"),
    isConsignment: formData.get("isConsignment") === "yes",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid row data.",
    };
  }
  const data = parsed.data;

  let imageUrls: string[];
  try {
    imageUrls = await uploadImages(data.sku, formData);
  } catch (err) {
    return {
      status: "error",
      message:
        err instanceof Error ? err.message : "Couldn't upload one of the photos.",
    };
  }
  if (imageUrls.length === 0) {
    return { status: "error", message: "No photos were attached for this SKU." };
  }

  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sku, data.sku))
    .limit(1);

  const priceCents = Math.round(data.priceUsd * 100);
  const compareAtPriceCents =
    data.compareAtPriceUsd == null ? null : Math.round(data.compareAtPriceUsd * 100);

  if (existing) {
    const productId = existing.id;

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
          category: data.category,
          color: data.color,
          condition: data.condition,
          priceCents,
          compareAtPriceCents,
          isConsignment: data.isConsignment,
          updatedAt: new Date(),
          // status is deliberately not touched here — a re-import must
          // never flip a sold/reserved/archived item back to "available".
        })
        .where(eq(products.id, productId));
    } catch (err) {
      if (isUniqueViolation(err, "title")) {
        return {
          status: "error",
          message: `A listing titled "${data.title}" already exists — add a distinguishing detail.`,
        };
      }
      return { status: "error", message: "Couldn't save this listing." };
    }

    const oldImages = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, productId));
    await db.delete(productImages).where(eq(productImages.productId, productId));
    for (const img of oldImages) {
      try {
        await del(img.url, {
          token: process.env.PONGOLUX_BLOB_PUBLIC_FINAL_READ_WRITE_TOKEN,
        });
      } catch {
        // Not fatal (matches deleteProductImageAction's same reasoning in
        // admin-products.ts) — the DB row controlling what's shown is
        // already replaced; a stray blob (or a local /products/ path from
        // the original bulk import, which del() can't touch anyway) can be
        // cleaned up later from the Vercel dashboard.
      }
    }

    await db.insert(productImages).values(
      imageUrls.map((url, position) => ({
        productId,
        url,
        alt: `${data.brand} ${data.title}`,
        position,
      }))
    );

    await db
      .insert(authenticationRecords)
      .values({
        productId,
        method: "entrupy",
        authenticatedBy: "PongoLux Authentication Team",
      })
      .onConflictDoUpdate({
        target: authenticationRecords.productId,
        set: { method: "entrupy", authenticatedBy: "PongoLux Authentication Team" },
      });

    revalidatePath("/shop");
    revalidatePath(`/product/${data.sku}`);
    revalidatePath("/admin/products");
    return {
      status: "updated",
      message: `Updated "${data.title}" — ${imageUrls.length} photo(s).`,
    };
  }

  let productId: string;
  try {
    const [created] = await db
      .insert(products)
      .values({
        sku: data.sku,
        brand: data.brand,
        model: data.model,
        title: data.title,
        description: data.description,
        conditionNotes: data.conditionNotes,
        dimensions: data.dimensions,
        category: data.category,
        color: data.color,
        condition: data.condition,
        priceCents,
        compareAtPriceCents,
        status: "available",
        isConsignment: data.isConsignment,
      })
      .returning({ id: products.id });
    productId = created.id;
  } catch (err) {
    if (isUniqueViolation(err, "sku")) {
      return { status: "error", message: `SKU "${data.sku}" is already in use.` };
    }
    if (isUniqueViolation(err, "title")) {
      return {
        status: "error",
        message: `A listing titled "${data.title}" already exists — add a distinguishing detail.`,
      };
    }
    return { status: "error", message: "Couldn't save this listing." };
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
    method: "entrupy",
    authenticatedBy: "PongoLux Authentication Team",
  });

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  return {
    status: "created",
    message: `Created "${data.title}" — ${imageUrls.length} photo(s).`,
  };
}
