import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // The blanket "/api/" disallow below is meant for internal/auth/
      // webhook routes, not this one — the Merchant Center feed has to be
      // fetchable by Google's crawler for scheduled-fetch to work at all.
      // A longer, more specific "Allow" always wins over a shorter
      // "Disallow" on the same path per the robots.txt spec, regardless of
      // the order they're listed in.
      allow: ["/", "/api/merchant-feed"],
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/account",
        "/cart",
        "/checkout",
        "/login",
        "/signup",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
