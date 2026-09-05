import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "pongolux_cart_id";

/**
 * A stable anonymous ID for the current shopper's cart, used purely to back
 * the one-of-one reservation system (see `products.reservedByCartId` in the
 * schema) — not tied to a signed-in account. Only callable from a Server
 * Action or Route Handler, since it may need to set the cookie.
 */
export async function getOrCreateCartId() {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return id;
}
