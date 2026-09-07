import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Static, always-present marketing/policy pages. Auth pages (/login,
 * /signup) and anything behind an account (/account, /cart, /checkout,
 * /admin) are deliberately left out — see robots.ts, which also blocks
 * crawling those. */
const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/shop/most-wanted", changeFrequency: "daily", priority: 0.7 },
  { path: "/shop/price-drops", changeFrequency: "daily", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/shipping-returns", changeFrequency: "monthly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Sold/archived pieces are one-of-one and no longer purchasable — still
  // reachable by direct link (see listProducts/shop sorting), but excluding
  // them from the sitemap keeps crawl budget on pieces that can actually be
  // bought right now.
  const available = await listProducts({ excludeSold: true });

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const productEntries: MetadataRoute.Sitemap = available
    .filter((p) => p.status === "available" || p.status === "reserved")
    .map((product) => ({
      url: `${SITE_URL}/product/${product.sku}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticEntries, ...productEntries];
}
