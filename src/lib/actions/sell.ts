"use server";

import { put } from "@vercel/blob";
import { db } from "@/db";
import { sellSubmissions, sellSubmissionPhotos } from "@/db/schema";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SellSubmissionSchema, SELL_SUBMISSION_MIN_PHOTOS } from "@/lib/validations";
import { sendSellSubmissionEmail } from "@/lib/email";

export type SellActionState = { error: string | null } | null;

function fieldsFromFormData(formData: FormData) {
  return {
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country") || "US",
    productName: formData.get("productName"),
    brand: formData.get("brand"),
    yearOfPurchase: formData.get("yearOfPurchase"),
    condition: formData.get("condition"),
    size: formData.get("size"),
    proofOfAuthenticityUrl: "", // filled in after upload, see below
    notes: formData.get("notes"),
  };
}

/** Uploads every non-empty file under a given FormData field to Vercel
 * Blob storage, returning public URLs in selection order. Same approach as
 * uploadImages() in src/lib/actions/admin-products.ts, generalized to a
 * configurable field/folder since this file needs it for both photos and
 * the optional proof-of-authenticity upload. */
async function uploadFiles(folder: string, formData: FormData, field: string) {
  const files = formData
    .getAll(field)
    .filter((f): f is File => f instanceof File && f.size > 0);

  const urls: string[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blob = await put(`${folder}/${crypto.randomUUID()}-${safeName}`, file, {
      access: "public",
      token: process.env.PONGOLUX_BLOB_PUBLIC_FINAL_READ_WRITE_TOKEN,
    });
    urls.push(blob.url);
  }
  return urls;
}

export async function submitSellSubmissionAction(
  _prevState: SellActionState,
  formData: FormData
): Promise<SellActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login?callbackUrl=/sell");
  }

  const parsed = SellSubmissionSchema.safeParse(fieldsFromFormData(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const photoFiles = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (photoFiles.length < SELL_SUBMISSION_MIN_PHOTOS) {
    return {
      error: `Please add at least ${SELL_SUBMISSION_MIN_PHOTOS} photos of the item.`,
    };
  }
  for (const file of photoFiles) {
    if (!file.type.startsWith("image/")) {
      return { error: `"${file.name}" isn't an image file.` };
    }
  }

  let photoUrls: string[];
  let proofUrls: string[];
  try {
    [photoUrls, proofUrls] = await Promise.all([
      uploadFiles(`sell-submissions/${userId}`, formData, "photos"),
      uploadFiles(`sell-submissions/${userId}/proof`, formData, "proofOfAuthenticity"),
    ]);
  } catch (err) {
    console.error("Sell submission file upload failed", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Couldn't upload one of the photos. Please try again.",
    };
  }

  let submissionId: string;
  try {
    const [submission] = await db
      .insert(sellSubmissions)
      .values({
        userId,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        productName: data.productName,
        brand: data.brand,
        yearOfPurchase: data.yearOfPurchase,
        condition: data.condition,
        size: data.size,
        proofOfAuthenticityUrl: proofUrls[0] ?? null,
        notes: data.notes,
      })
      .returning({ id: sellSubmissions.id });
    submissionId = submission.id;
  } catch (err) {
    console.error("Failed to save sell submission", err);
    return { error: "Couldn't save your submission. Please try again." };
  }

  await db.insert(sellSubmissionPhotos).values(
    photoUrls.map((url, position) => ({
      sellSubmissionId: submissionId,
      url,
      position,
    }))
  );

  try {
    await sendSellSubmissionEmail({
      submissionId,
      sellerName: data.contactName,
      sellerEmail: data.contactEmail,
      sellerPhone: data.contactPhone,
      address: `${data.addressLine1}${data.addressLine2 ? `, ${data.addressLine2}` : ""}, ${data.city}, ${data.state} ${data.postalCode}, ${data.country}`,
      productName: data.productName,
      brand: data.brand,
      yearOfPurchase: data.yearOfPurchase,
      condition: data.condition,
      size: data.size,
      proofOfAuthenticityUrl: proofUrls[0] ?? null,
      notes: data.notes,
      photoUrls,
    });
  } catch (err) {
    // Not fatal — the submission is already saved and visible on /account;
    // Irdi can still find it there even if the email notification failed.
    console.error("Failed to send sell submission email", err);
  }

  revalidatePath("/account");
  redirect("/sell?submitted=1");
}
