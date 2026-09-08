-- New table backing the "save for later" wishlist feature. Requires a
-- signed-in account (unlike the cart, which works anonymously) — a
-- shopper can only save a given product once, enforced by the unique
-- index on (user_id, product_id).
CREATE TABLE "wishlist_item" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "product_id" text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "wishlist_item_user_product_idx" ON "wishlist_item" ("user_id", "product_id");
CREATE INDEX "wishlist_item_user_id_idx" ON "wishlist_item" ("user_id");
