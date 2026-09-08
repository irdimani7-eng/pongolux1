import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { CartBadge } from "@/components/cart-badge";
import { WishlistBadge } from "@/components/wishlist-badge";
import { Logo } from "@/components/logo";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link href="/shop" className="hover:text-accent transition-colors">
            Shop
          </Link>
          <Link
            href="/shop/price-drops"
            className="hover:text-accent transition-colors"
          >
            New Price Drops
          </Link>
          <Link
            href="/shop/most-wanted"
            className="hover:text-accent transition-colors"
          >
            Most Wanted
          </Link>
          <Link href="/about" className="hover:text-accent transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-accent transition-colors">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <div className="flex items-center gap-1">
              {session.user.role === "admin" && (
                <Link
                  href="/admin"
                  className="px-3 py-2 text-sm hover:text-accent transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/account"
                className="px-3 py-2 text-sm hover:text-accent transition-colors"
              >
                {session.user.name?.split(" ")[0] ?? "Account"}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="px-2 py-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  Sign out
                </button>
              </form>
              <WishlistBadge />
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-2 text-sm hover:text-accent transition-colors"
            >
              Sign in
            </Link>
          )}
          <CartBadge />
        </div>
      </div>
    </header>
  );
}
