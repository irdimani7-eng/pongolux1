/**
 * Imports real product listings from a CSV + a folder of per-SKU photo
 * folders into the live catalog. Uses the same columns described in
 * product-intake-instructions.md.
 *
 * Usage:
 *   npm run db:import -- path/to/products.csv path/to/photo-folders
 *
 * Each row's `sku` is matched against a subfolder of the photo-folders
 * directory whose name starts with "<sku>-" (this is exactly how the photo
 * exports Irdi already has are named, e.g.
 * "PL-0001-Some Bag Title/photo1.webp"). Every image in that folder is
 * copied into public/products/<sku>/ so it ships with the site, and the
 * database is pointed at those local copies.
 *
 * If a row's `price_usd` or `condition` column is blank, its photos are
 * still copied (so you can preview them), but no database row is written —
 * fill in those two columns and re-run to actually publish the listing.
 * Re-running is always safe: an existing SKU is updated in place rather than
 * duplicated.
 *
 * This is the command-line sibling of the "Bulk import" page in /admin
 * (src/components/admin/bulk-import-form.tsx) — same CSV format, same
 * folder-per-SKU photo convention, and both share the parsing/sorting logic
 * in src/lib/csv.ts and src/lib/sort-image-files.ts so the two never drift
 * apart on how a row or a filename gets read. This script is still the
 * right tool when Irdi already has everything sitting in local folders and
 * wants a single command; the admin page is the right tool when working
 * from the browser without a local Node setup.
 */
import {
  readFileSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
} from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { products, productImages, authenticationRecords } from "../src/db/schema";
import { parseCsv } from "../src/lib/csv";
import { sortByImageOrder } from "../src/lib/sort-image-files";

type Row = Record<
  | "sku"
  | "brand"
  | "model"
  | "title"
  | "description"
  | "category"
  | "color"
  | "condition"
  | "price_usd"
  | "is_consignment"
  | "photo_folder_name",
  string
>;

const CATEGORIES = ["handbag", "wallet", "accessory", "other"] as const;
const CONDITIONS = [
  "new",
  "like_new",
  "excellent",
  "very_good",
  "good",
  "fair",
] as const;

async function main() {
  const [csvPath, photosDir] = process.argv.slice(2);
  if (!csvPath || !photosDir) {
    console.error(
      "Usage: npm run db:import -- <csv-path> <photos-dir>"
    );
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(csvPath, "utf-8")) as Row[];
  const publicDir = path.resolve(__dirname, "../public/products");
  const availableFolders = readdirSync(photosDir);

  for (const row of rows) {
    if (!row.sku) continue;

    const folderName = availableFolders.find(
      (f) =>
        f === row.photo_folder_name ||
        f === row.sku ||
        f.startsWith(`${row.sku}-`)
    );
    if (!folderName) {
      console.log(
        `⚠ ${row.sku}: no matching photo folder found under ${photosDir}, skipping entirely`
      );
      continue;
    }

    const srcDir = path.join(photosDir, folderName);
    const files = readdirSync(srcDir).filter((f) =>
      /\.(webp|jpe?g|png)$/i.test(f)
    );
    if (files.length === 0) {
      console.log(`⚠ ${row.sku}: photo folder has no images, skipping`);
      continue;
    }
    const ordered = sortByImageOrder(files, (f) => f);

    const destDir = path.join(publicDir, row.sku);
    mkdirSync(destDir, { recursive: true });
    ordered.forEach((f, i) => {
      copyFileSync(
        path.join(srcDir, f),
        path.join(destDir, `${i + 1}${path.extname(f).toLowerCase()}`)
      );
    });
    console.log(
      `✓ ${row.sku}: copied ${ordered.length} photo(s) to public/products/${row.sku}/`
    );

    const priceUsd = row.price_usd?.trim();
    const condition = row.condition?.trim();
    if (!priceUsd || !condition) {
      console.log(
        `  → price and/or condition not filled in yet — photos are ready, but skipping the database row until both are set`
      );
      continue;
    }
    if (!CONDITIONS.includes(condition as (typeof CONDITIONS)[number])) {
      console.log(
        `  → unrecognized condition "${condition}" (expected one of: ${CONDITIONS.join(", ")}), skipping`
      );
      continue;
    }
    const category = CATEGORIES.includes(
      row.category as (typeof CATEGORIES)[number]
    )
      ? (row.category as (typeof CATEGORIES)[number])
      : "handbag";

    const priceCents = Math.round(Number(priceUsd) * 100);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      console.log(`  → invalid price_usd "${priceUsd}", skipping`);
      continue;
    }

    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, row.sku));

    let productId: string;
    if (existing) {
      await db
        .update(products)
        .set({
          brand: row.brand,
          model: row.model,
          title: row.title,
          description: row.description,
          category,
          color: row.color,
          condition: condition as (typeof CONDITIONS)[number],
          priceCents,
          isConsignment: row.is_consignment?.toLowerCase() === "yes",
          updatedAt: new Date(),
        })
        .where(eq(products.id, existing.id));
      productId = existing.id;
      await db.delete(productImages).where(eq(productImages.productId, productId));
    } else {
      const [created] = await db
        .insert(products)
        .values({
          sku: row.sku,
          brand: row.brand,
          model: row.model,
          title: row.title,
          description: row.description,
          category,
          color: row.color,
          condition: condition as (typeof CONDITIONS)[number],
          priceCents,
          status: "available",
          isConsignment: row.is_consignment?.toLowerCase() === "yes",
        })
        .returning({ id: products.id });
      productId = created.id;
    }

    await db.insert(productImages).values(
      ordered.map((f, i) => ({
        productId,
        url: `/products/${row.sku}/${i + 1}${path.extname(f).toLowerCase()}`,
        alt: row.title,
        position: i,
      }))
    );

    await db
      .insert(authenticationRecords)
      .values({
        productId,
        method: "entrupy",
        authenticatedBy: "PongoLux Authentication Team",
      })
      .onConflictDoUpdate({
        target: authenticationRecords.productId,
        set: { method: "entrupy", authenticatedBy: "PongoLux Authentication Team" },
      });

    console.log(`  → published live: ${row.title} ($${priceUsd})`);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
