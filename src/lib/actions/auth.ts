"use server";

import { db } from "@/db";
import { users, credentials } from "@/db/schema";
import { SignupSchema } from "@/lib/validations";
import { hashPassword, signIn } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type AuthActionState = { error: string | null } | null;

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

  await signIn("credentials", { email, password, redirectTo: "/account" });
  redirect("/account");
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/account",
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
