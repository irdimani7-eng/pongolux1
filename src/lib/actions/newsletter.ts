"use server";

import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { z } from "zod";

export type NewsletterActionState = { error: string | null; success: boolean } | null;

const EmailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");

export async function subscribeToNewsletterAction(
  _prevState: NewsletterActionState,
  formData: FormData
): Promise<NewsletterActionState> {
  const parsed = EmailSchema.safeParse(formData.get("email"));

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
      success: false,
    };
  }

  try {
    // onConflictDoNothing: re-submitting an already-subscribed email is a
    // silent no-op success, not an error — a visitor who forgot they'd
    // already signed up shouldn't see a confusing failure message.
    await db
      .insert(newsletterSubscribers)
      .values({ email: parsed.data })
      .onConflictDoNothing();
  } catch (err) {
    console.error("Newsletter signup failed", err);
    return {
      error: "Something went wrong — please try again.",
      success: false,
    };
  }

  return { error: null, success: true };
}
