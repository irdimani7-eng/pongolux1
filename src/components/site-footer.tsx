import Link from "next/link";
import { Logo } from "@/components/logo";
import { InstagramIcon } from "@/components/social-icons";
import { MessageCircle } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/social-links";
import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
import { PaymentMethods } from "@/components/payment-methods";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-(family-name:--font-display) text-lg">
              Get new arrivals first
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Since every piece is one-of-one, our list is the fastest way to
              hear about new finds before they&apos;re gone.
            </p>
          </div>
          <NewsletterSignupForm />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 text-sm sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-muted-foreground">
            Authenticated designer handbags, resold with confidence. Based in
            Chicago, IL.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="PongoLux on Instagram"
              className="text-muted-foreground hover:text-accent"
            >
              <InstagramIcon className="size-5" />
            </a>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message PongoLux on WhatsApp"
              className="text-muted-foreground hover:text-accent"
            >
              <MessageCircle className="size-5" strokeWidth={1.5} />
            </a>
          </div>
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
            <li>
              <Link href="/shop/price-drops" className="hover:text-accent">
                New price drops
              </Link>
            </li>
            <li>
              <Link href="/shop/most-wanted" className="hover:text-accent">
                Most wanted
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium">About</h3>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link href="/about" className="hover:text-accent">
                Our story
              </Link>
            </li>
            <li>
              <Link href="/authenticity" className="hover:text-accent">
                Authenticity
              </Link>
            </li>
            <li>
              <Link href="/shipping-returns" className="hover:text-accent">
                Shipping &amp; returns
              </Link>
            </li>
            <li>
              <Link href="/sell" className="hover:text-accent">
                Sell to us
              </Link>
            </li>
            <li>
              <Link href="/dreams" className="hover:text-accent">
                Bag of dreams
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium">Contact</h3>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link href="/contact" className="hover:text-accent">
                Contact us
              </Link>
            </li>
            <li>
              <a href="mailto:support@pongolux.com" className="hover:text-accent">
                support@pongolux.com
              </a>
            </li>
            <li>
              <a href="tel:+13127740792" className="hover:text-accent">
                (312) 774-0792
              </a>
            </li>
            <li>Chicago, IL</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-6 py-6">
        <PaymentMethods />
      </div>
      <div className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} PONGOLUX LLC. All rights reserved.</p>
        <p className="mt-1">
          PongoLux is an independent reseller and is not affiliated with,
          endorsed by, or sponsored by any of the brands offered on this
          site. All brand names, logos, and trademarks are the property of
          their respective owners.
        </p>
        <p className="mt-2">
          <Link href="/privacy" className="hover:text-accent">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="hover:text-accent">
            Terms of Service
          </Link>
        </p>
      </div>
    </footer>
  );
}
