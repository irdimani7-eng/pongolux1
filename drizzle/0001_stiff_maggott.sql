ALTER TABLE "product" ADD COLUMN "compare_at_price_cents" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "is_most_wanted" boolean DEFAULT false NOT NULL;