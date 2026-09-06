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
    ],
  },
};

export default nextConfig;
