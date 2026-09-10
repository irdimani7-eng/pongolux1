import { db } from "@/db";
import { dreamInquiries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export type DreamInquiryForAccount = {
  id: string;
  brand: string;
  modelOrStyle: string;
  status: string;
  createdAt: Date;
};

/** Bag of Dreams inquiries for a customer's account page, newest first —
 * same fail-closed reasoning as getWishlistProducts() in
 * src/lib/wishlist.ts: if migration-009-dream-inquiries.sql hasn't been
 * run yet against this database, the account page still loads instead of
 * 500ing. */
export async function getDreamInquiriesForUser(
  userId: string
): Promise<DreamInquiryForAccount[]> {
  try {
    const rows = await db
      .select({
        id: dreamInquiries.id,
        brand: dreamInquiries.brand,
        modelOrStyle: dreamInquiries.modelOrStyle,
        status: dreamInquiries.status,
        createdAt: dreamInquiries.createdAt,
      })
      .from(dreamInquiries)
      .where(eq(dreamInquiries.userId, userId))
      .orderBy(desc(dreamInquiries.createdAt));
    return rows;
  } catch (err) {
    console.error("Failed to load dream inquiries for user", userId, err);
    return [];
  }
}
