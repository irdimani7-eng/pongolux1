import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WishlistProvider } from "@/components/wishlist-provider";
import { auth } from "@/lib/auth";
import { getWishlistProductIds } from "@/lib/wishlist";
import { GOOGLE_MERCHANT_ID } from "@/lib/google-merchant";
import "./globals.css";

// Fonts: this scaffold intentionally uses system font stacks (defined in
// globals.css) instead of next/font/google, so the build never depends on
// reaching Google's font CDN — handy in network-restricted environments, and
// one less external dependency in production. Once PongoLux's brand
// typography is chosen, swap the CSS variables in globals.css for
// next/font/local pointing at the licensed font files (or next/font/google
// if reaching fonts.googleapis.com is fine in your deployment target).

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = "PongoLux";
const SITE_DESCRIPTION =
  "PongoLux is a US-based reseller of 100% authenticated designer handbags. Every piece is independently verified before it reaches you.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PongoLux — Authenticated Designer Handbags",
    template: "%s — PongoLux",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "designer handbags",
    "authenticated handbags",
    "pre-owned designer bags",
    "luxury handbag reseller",
    "Chanel",
    "Louis Vuitton",
    "Gucci",
    "Hermès",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "PongoLux — Authenticated Designer Handbags",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "PongoLux — Authenticated Designer Handbags",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  // Set GOOGLE_SITE_VERIFICATION in Vercel with the code Google Search
  // Console gives you when verifying via the "HTML tag" method (Settings →
  // Ownership verification) — no code change needed after that, just the
  // env var + a redeploy. Omitted entirely (rather than an empty string)
  // when unset, so it doesn't emit an empty/invalid meta tag.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

/** Organization structured data (JSON-LD) — helps Google understand
 * PongoLux as a real business entity (name, contact info, socials) rather
 * than just a collection of pages. See
 * node_modules/next/dist/docs/01-app/02-guides/json-ld.md for the
 * convention this follows. */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: SITE_DESCRIPTION,
  email: "support@pongolux.com",
  telephone: "+1-312-774-0792",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Chicago",
    addressRegion: "IL",
    addressCountry: "US",
  },
  sameAs: [
    "https://www.instagram.com/pongo.lux",
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const signedIn = Boolean(session?.user?.id);
  // Seeded once here (server-side) rather than fetched client-side, so
  // every heart icon on the page — product cards, product detail — lights
  // up correctly on first paint instead of flashing "unsaved" then
  // catching up.
  const initialWishlistIds = signedIn
    ? await getWishlistProductIds(session!.user!.id!)
    : [];

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <WishlistProvider initialIds={initialWishlistIds} signedIn={signedIn}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </WishlistProvider>
        {/* Vercel Analytics — zero-config visitor/page-view tracking, no
            cookie banner needed (it's cookieless/privacy-friendly by
            default). View traffic in the Vercel dashboard's Analytics tab
            once deployed; does nothing extra locally. */}
        <Analytics />

        {/* Google Customer Reviews badge — optional (per Merchant
            Center's own "Getting started" copy), separate from the
            required survey opt-in module on the checkout success page.
            Shows PongoLux's aggregate seller rating once enough real
            reviews have come in from that opt-in flow; shows "no rating
            available" until then, which is expected for a brand-new
            integration. Only the required `merchant_id` field is set —
            the optional `position`/`region` fields are left to Google's
            own default placement rather than guessed at, since their
            exact accepted values weren't confirmed at the time this was
            added; see Merchant Center's "Learn more about badge
            integration" link if a specific corner/region is wanted
            later. */}
        <Script
          id="merchantWidgetScript"
          src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
          strategy="afterInteractive"
        />
        <Script id="google-customer-reviews-badge-init" strategy="afterInteractive">
          {`
            var widgetScript = document.getElementById('merchantWidgetScript');
            if (widgetScript) {
              widgetScript.addEventListener('load', function () {
                if (window.merchantwidget) {
                  window.merchantwidget.start({
                    merchant_id: ${GOOGLE_MERCHANT_ID}
                  });
                }
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
