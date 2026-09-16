import { auth } from "@/lib/auth";
import { CartPageClient } from "@/components/cart-page-client";

// Server wrapper only exists to pass a signed-in shopper's session email down
// to the client cart — see the email-capture logic in CartPageClient (used
// for abandoned-cart reminders, src/lib/abandoned-cart.ts). Everything else
// about the cart still lives client-side, reading the Zustand cart store.
export default async function CartPage() {
  const session = await auth();
  return <CartPageClient initialEmail={session?.user?.email ?? null} />;
}
