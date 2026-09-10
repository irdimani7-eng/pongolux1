import { db } from "@/db";
import { sellSubmissions, sellSubmissionPhotos } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export type SellSubmissionForAccount = {
  id: string;
  productName: string;
  brand: string;
  status: string;
  quoteType: string | null;
  quoteAmountCents: number | null;
  quoteNotes: string | null;
  createdAt: Date;
  thumbnailUrl: string | null;
};

/** Sell submissions for a customer's account page, newest first — same
 * fail-closed reasoning as getWishlistProducts() in src/lib/wishlist.ts:
 * if migration-008-sell-submissions.sql hasn't been run yet against this
 * database, every account page load would otherwise 500 instead of just
 * omitting this section. */
export async function getSellSubmissionsForUser(
  userId: string
): Promise<SellSubmissionForAccount[]> {
  try {
    const rows = await db
      .select()
      .from(sellSubmissions)
      .where(eq(sellSubmissions.userId, userId))
      .orderBy(desc(sellSubmissions.createdAt));

    return await Promise.all(
      rows.map(async (row) => {
        const [photo] = await db
          .select({ url: sellSubmissionPhotos.url })
          .from(sellSubmissionPhotos)
          .where(eq(sellSubmissionPhotos.sellSubmissionId, row.id))
          .orderBy(asc(sellSubmissionPhotos.position))
          .limit(1);
        return {
          id: row.id,
          productName: row.productName,
          brand: row.brand,
          status: row.status,
          quoteType: row.quoteType,
          quoteAmountCents: row.quoteAmountCents,
          quoteNotes: row.quoteNotes,
          createdAt: row.createdAt,
          thumbnailUrl: photo?.url ?? null,
        };
      })
    );
  } catch (err) {
    console.error("Failed to load sell submissions for user", userId, err);
    return [];
  }
}
