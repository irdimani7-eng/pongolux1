"use server";

import { db } from "@/db";
import { dreamInquiries } from "@/db/schema";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DreamInquirySchema } from "@/lib/validations";
import { sendDreamInquiryEmail } from "@/lib/email";

export type DreamActionState = { error: string | null } | null;

export async function submitDreamInquiryAction(
  _prevState: DreamActionState,
  formData: FormData
): Promise<DreamActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !session?.user?.email) {
    redirect("/login?callbackUrl=/dreams");
  }

  const parsed = DreamInquirySchema.safeParse({
    brand: formData.get("brand"),
    modelOrStyle: formData.get("modelOrStyle"),
    colorPreference: formData.get("colorPreference"),
    sizePreference: formData.get("sizePreference"),
    budgetRange: formData.get("budgetRange"),
    occasion: formData.get("occasion"),
    details: formData.get("details"),
    contactPreference: formData.get("contactPreference") || "either",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  let inquiryId: string;
  try {
    const [inquiry] = await db
      .insert(dreamInquiries)
      .values({ userId, ...data })
      .returning({ id: dreamInquiries.id });
    inquiryId = inquiry.id;
  } catch (err) {
    console.error("Failed to save dream inquiry", err);
    return { error: "Couldn't save your inquiry. Please try again." };
  }

  try {
    await sendDreamInquiryEmail({
      inquiryId,
      customerName: session.user.name ?? "A PongoLux customer",
      customerEmail: session.user.email,
      brand: data.brand,
      modelOrStyle: data.modelOrStyle,
      colorPreference: data.colorPreference,
      sizePreference: data.sizePreference,
      budgetRange: data.budgetRange,
      occasion: data.occasion,
      details: data.details,
      contactPreference: data.contactPreference,
    });
  } catch (err) {
    console.error("Failed to send dream inquiry email", err);
  }

  revalidatePath("/account");
  redirect("/dreams?submitted=1");
}
