import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Guards every /admin page and admin server action. Redirects a signed-out
 * visitor to log in, and a signed-in non-admin back to the storefront —
 * either way nothing under /admin ever renders or runs for a non-admin.
 *
 * To make someone an admin: they sign up/sign in on the site like any
 * customer, then run
 *   UPDATE "user" SET role = 'admin' WHERE email = '<their email>';
 * in the database (Neon's SQL Editor, or wherever the prod DB lives) and
 * sign in again.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }
  return session;
}
