import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { CartBadge } from "@/components/cart-badge";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-(family-name:--font-display) text-2xl tracking-wide"
        >
          PongoLux
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link href="/shop" className="hover:text-accent transition-colors">
            Shop
          </Link>
          <Link
            href="/shop?category=handbag"
            className="hover:text-accent transition-colors"
          >
            Handbags
          </Link>
          <Link
            href="/#authentication"
            className="hover:text-accent transition-colors"
          >
            Our Authentication Process
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <div className="flex items-center gap-1">
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
