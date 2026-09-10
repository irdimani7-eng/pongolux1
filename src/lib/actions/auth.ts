"use server";

import { db } from "@/db";
import { users, credentials } from "@/db/schema";
import { SignupSchema } from "@/lib/validations";
import { hashPassword, signIn } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type AuthActionState = { error: string | null } | null;

const DEFAULT_REDIRECT = "/account";

/** Only allows a same-origin, relative redirect target. `callbackUrl`
 * arrives as a plain query param (e.g. /login?callbackUrl=/sell), so it's
 * attacker-controlled input — without this check, someone could craft a
 * link like /login?callbackUrl=https://evil.example and get a signed-in
 * user redirected off PongoLux right after authenticating. */
function safeRedirectTarget(target: FormDataEntryValue | null): string {
  if (
    typeof target !== "string" ||
    target === "" ||
    !target.startsWith("/") ||
    target.startsWith("//")
  ) {
    return DEFAULT_REDIRECT;
  }
  return target;
}

export async function signup(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, email, password } = parsed.data;
  const redirectTo = safeRedirectTarget(formData.get("callbackUrl"));

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const [user] = await db
    .insert(users)
    .values({ name, email })
    .returning({ id: users.id });

  await db.insert(credentials).values({
    email,
    userId: user.id,
    passwordHash: await hashPassword(password),
  });

  await signIn("credentials", { email, password, redirectTo });
  redirect(redirectTo);
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirectTarget(formData.get("callbackUrl"));

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (err) {
    // next-auth throws a redirect internally on success; anything else here
    // means the credentials didn't check out.
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: "Invalid email or password." };
  }
  return null;
}
