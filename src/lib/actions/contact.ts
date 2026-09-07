"use server";

import { ContactFormSchema } from "@/lib/validations";
import { sendContactFormEmail } from "@/lib/email";

export type ContactActionState = { error: string | null; success: boolean } | null;

export async function submitContactForm(
  _prevState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
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
