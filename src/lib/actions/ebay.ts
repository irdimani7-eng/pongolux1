"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getProductForEbay } from "@/lib/products";
import { publishProductToEbay, endEbayListingForProduct, isEbayConnected } from "@/lib/ebay";

export type EbayActionState = { error: string | null } | null;

export async function listProductOnEbayAction(
  productId: string
): Promise<EbayActionState> {
  await requireAdmin();

  if (!(await isEbayConnected())) {
    return { error: "eBay isn't connected yet — connect it from /admin/ebay first." };
  }

  const product = await getProductForEbay(productId);
  if (!product) return { error: "Product not found." };
  if (product.imageUrls.length === 0) {
    return { error: "This listing has no photos yet — eBay requires at least one image." };
  }

  const result = await publishProductToEbay(productId, product);
  revalidatePath(`/admin/products/${productId}/edit`);

  if (!result.ok) return { error: result.error };
  return null;
}

export async function endEbayListingAction(
  productId: string
): Promise<EbayActionState> {
  await requireAdmin();

  const result = await endEbayListingForProduct(productId);
  revalidatePath(`/admin/products/${productId}/edit`);

  if (!result.ok) return { error: result.error };
  return null;
}
