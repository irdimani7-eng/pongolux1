/**
 * Seeds the database with sample handbag listings so the storefront has
 * something to render in development. All product photos are generic
 * placeholder images (picsum.photos) — swap this file's data for real
 * inventory and photography before going live.
 *
 * Usage: npm run db:seed
 */
// Env vars are loaded via `node --env-file=.env.local` (see the `db:seed`
// script in package.json) rather than dotenv here — ES module imports are
// hoisted above any code in this file, so `db/index.ts` would otherwise read
// `process.env.DATABASE_URL` before a same-file dotenv call had run.
import { db } from "../src/db";
import {
  products,
  productImages,
  authenticationRecords,
} from "../src/db/schema";

const SAMPLE_PRODUCTS = [
  {
    slug: "chanel-classic-flap-medium-black",
    brand: "Chanel",
    model: "Classic Flap Medium",
    title: "Classic Flap Medium in Black Caviar",
    description:
      "Timeless black caviar leather classic flap with gold-tone hardware. Gently carried, stored in dust bag between uses.",
    category: "handbag" as const,
    condition: "excellent" as const,
    priceCents: 749_900,
    seed: "chanel1",
  },
  {
    slug: "hermes-birkin-30-etoupe",
    brand: "Hermès",
    model: "Birkin 30",
    title: "Birkin 30 in Etoupe Togo Leather",
    description:
      "Neutral etoupe togo leather Birkin with palladium hardware. Excellent structure, light corner wear consistent with careful use.",
    category: "handbag" as const,
    condition: "very_good" as const,
    priceCents: 1_589_900,
    seed: "hermes1",
  },
  {
    slug: "louis-vuitton-neverfull-mm-damier",
    brand: "Louis Vuitton",
    model: "Neverfull MM",
    title: "Neverfull MM in Damier Ebene",
    description:
      "Everyday tote in Damier Ebene canvas with red interior. Includes matching pochette. Light patina on the leather trim.",
    category: "handbag" as const,
    condition: "good" as const,
    priceCents: 129_900,
    seed: "lv1",
  },
  {
    slug: "gucci-marmont-small-matelasse",
    brand: "Gucci",
    model: "GG Marmont Small",
    title: "GG Marmont Small Matelassé Shoulder Bag",
    description:
      "Black matelassé chevron leather with antique gold-tone hardware. Adjustable chain strap. Excellent condition.",
    category: "handbag" as const,
    condition: "like_new" as const,
    priceCents: 149_900,
    seed: "gucci1",
  },
  {
    slug: "prada-re-edition-2005-nylon",
    brand: "Prada",
    model: "Re-Edition 2005",
    title: "Re-Edition 2005 Nylon Shoulder Bag",
    description:
      "Black Re-Nylon mini shoulder bag with the classic triangle logo. Brand new, never carried.",
    category: "handbag" as const,
    condition: "new" as const,
    priceCents: 119_900,
    seed: "prada1",
  },
  {
    slug: "chanel-wallet-on-chain-caviar",
    brand: "Chanel",
    model: "Wallet on Chain",
    title: "Wallet on Chain in Caviar Leather",
    description:
      "Compact WOC in black caviar leather with gold-tone hardware. Excellent structure and corners.",
    category: "wallet" as const,
    condition: "excellent" as const,
    priceCents: 349_900,
    seed: "chanel2",
  },
] satisfies Array<{
  slug: string;
  brand: string;
  model: string;
  title: string;
  description: string;
  category: "handbag" | "wallet" | "accessory" | "other";
  condition: "new" | "like_new" | "excellent" | "very_good" | "good" | "fair";
  priceCents: number;
  seed: string;
}>;

async function main() {
  console.log("Seeding PongoLux sample catalog...");

  for (const item of SAMPLE_PRODUCTS) {
    const [product] = await db
      .insert(products)
      .values({
        slug: item.slug,
        brand: item.brand,
        model: item.model,
        title: item.title,
        description: item.description,
        category: item.category,
        condition: item.condition,
        priceCents: item.priceCents,
        status: "available",
      })
      .onConflictDoNothing({ target: products.slug })
      .returning({ id: products.id });

    if (!product) {
      console.log(`- skipped (already exists): ${item.title}`);
      continue;
    }

    await db.insert(productImages).values([
      {
        productId: product.id,
        url: `https://picsum.photos/seed/${item.seed}-1/900/1125`,
        alt: item.title,
        position: 0,
      },
      {
        productId: product.id,
        url: `https://picsum.photos/seed/${item.seed}-2/900/900`,
        alt: `${item.title} detail`,
        position: 1,
      },
    ]);

    await db.insert(authenticationRecords).values({
      productId: product.id,
      method: "in_house_expert",
      authenticatedBy: "PongoLux Authentication Team",
    });

    console.log(`- created: ${item.title}`);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
