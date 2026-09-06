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

/** Minimal RFC-4180-ish CSV parser: handles quoted fields with commas. */
function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    return fields;
  };

  const header = parseLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row = {} as Row;
    header.forEach((key, i) => {
      (row as Record<string, string>)[key] = (values[i] ?? "").trim();
    });
    return row;
  });
}

/** Bare "name.ext" sorts first (the primary/cover shot), then "-1, -2, ...
 * -11" suffixes sort numerically rather than alphabetically (so "-2" comes
 * before "-10"). */
function sortImageFiles(files: string[]): string[] {
  const suffixNum = (f: string) => {
    const m = f.match(/-(\d+)\.\w+$/);
    return m ? parseInt(m[1], 10) : -1;
  };
  return [...files].sort((a, b) => suffixNum(a) - suffixNum(b));
}

async function main() {
  const [csvPath, photosDir] = process.argv.slice(2);
  if (!csvPath || !photosDir) {
    console.error(
      "Usage: npm run db:import -- <csv-path> <photos-dir>"
    );
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(csvPath, "utf-8"));
  const publicDir = path.resolve(__dirname, "../public/products");
  const availableFolders = readdirSync(photosDir);

  for (const row of rows) {
    if (!row.sku) continue;

    const folderName = availableFolders.find(
      (f) => f === row.photo_folder_name || f.startsWith(`${row.sku}-`)
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
    const ordered = sortImageFiles(files);

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
