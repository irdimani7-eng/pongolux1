"use server";

import { ContactFormSchema } from "@/lib/validations";
import { sendContactFormEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export type ContactActionState = { error: string | null; success: boolean } | null;

const BOT_CHECK_FAILED_MESSAGE =
  "We couldn't verify you're not a bot. Please try again.";
const RATE_LIMITED_MESSAGE =
  "Too many messages sent — please wait a bit before trying again.";

export async function submitContactForm(
  _prevState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const rateLimit = await checkRateLimit("contact");
  if (!rateLimit.allowed) {
    return { error: RATE_LIMITED_MESSAGE, success: false };
  }

  const turnstile = await verifyTurnstileToken(
    formData.get("cf-turnstile-response")
  );
  if (!turnstile.ok) {
    return { error: BOT_CHECK_FAILED_MESSAGE, success: false };
  }

  const parsed = ContactFormSchema.safeParse({
    attention: formData.get("attention"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check your entries.",
      success: false,
    };
  }

  try {
    await sendContactFormEmail(parsed.data);
  } catch (err) {
    console.error("Contact form email failed to send", err);
    return {
      error: "Something went wrong sending your message. Please try again.",
      success: false,
    };
  }

  return { error: null, success: true };
}
