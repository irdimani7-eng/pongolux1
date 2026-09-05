import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

// Fonts: this scaffold intentionally uses system font stacks (defined in
// globals.css) instead of next/font/google, so the build never depends on
// reaching Google's font CDN — handy in network-restricted environments, and
// one less external dependency in production. Once PongoLux's brand
// typography is chosen, swap the CSS variables in globals.css for
// next/font/local pointing at the licensed font files (or next/font/google
// if reaching fonts.googleapis.com is fine in your deployment target).

export const metadata: Metadata = {
  title: {
    default: "PongoLux — Authenticated Designer Handbags",
    template: "%s — PongoLux",
  },
  description:
    "PongoLux is a US-based reseller of 100% authenticated designer handbags. Every piece is independently verified before it reaches you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
