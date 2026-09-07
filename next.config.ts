import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
