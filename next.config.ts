import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server Actions cap request bodies at 1MB by default, which the
      // admin "New listing" / "Edit listing" forms blow past immediately
      // once real photos are attached (each is easily a few hundred KB to
      // a few MB, and a listing typically has 10+ of them). This is what
      // was behind the "Body exceeded 1 MB limit" / 413 error on
      // /admin/products/new and /admin/products/[id]/edit.
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: [
      // Seed/demo data only — swap for your real product-photo host
      // (e.g. Cloudinary or Cloudflare R2) once real assets are in place.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // Free-license editorial/lifestyle photography (Unsplash) used for
      // homepage/section hero banners — see src/lib/marketing-images.ts.
      { protocol: "https", hostname: "images.unsplash.com" },
      // Vercel Blob storage — where photos uploaded through /admin land
      // (Vercel's serverless functions can't write into /public at runtime,
      // unlike scripts/import-products.ts which runs locally at build time).
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  // Baseline security headers — safe, low-risk hardening that doesn't
  // touch what the app is allowed to load (no Content-Security-Policy
  // here, since that would need careful tuning against Stripe/Vercel
  // Blob/Unsplash and is easy to get subtly wrong; worth a dedicated pass
  // later rather than bundling it in here).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stops the site from being loaded in an <iframe> on another
          // domain (clickjacking protection).
          { key: "X-Frame-Options", value: "DENY" },
          // Stops browsers from "sniffing" a response into a different
          // content type than the server declared.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Only sends the origin (not the full URL/path) as the Referer
          // header on cross-site navigation — avoids leaking, e.g., a
          // customer's order-confirmation URL to a third-party site.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
