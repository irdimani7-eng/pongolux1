import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 text-sm sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-muted-foreground">
            Authenticated designer handbags, resold with confidence. Based in
            Chicago, IL.
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
          <h3 className="font-medium">Contact</h3>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <a href="mailto:support@pongolux.com" className="hover:text-accent">
                support@pongolux.com
              </a>
            </li>
            <li>
              <a href="tel:+13127750792" className="hover:text-accent">
                (312) 775-0792
              </a>
            </li>
            <li>Chicago, IL</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PONGOLUX LLC. All rights reserved.
      </div>
    </footer>
  );
}
