import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 text-sm sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="font-(family-name:--font-display) text-xl">
            PongoLux
          </div>
          <p className="mt-3 max-w-xs text-muted-foreground">
            Authenticated designer handbags, resold with confidence. Based in
            the United States.
          </p>
        </div>

        <div>
          <h3 className="font-medium">Shop</h3>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link href="/shop" className="hover:text-accent">
                All handbags
              </Link>
            </li>
            <li>
              <Link href="/shop?category=accessory" className="hover:text-accent">
                Accessories
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium">About</h3>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link href="/#authentication" className="hover:text-accent">
                Authentication process
              </Link>
            </li>
            <li>
              <Link href="/shipping-returns" className="hover:text-accent">
                Shipping &amp; returns
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium">Account</h3>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link href="/account" className="hover:text-accent">
                Order history
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-accent">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PongoLux. All rights reserved.
      </div>
    </footer>
  );
}
