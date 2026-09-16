-- Migration 011: Abandoned-cart recovery
--
-- Adds two small tables backing the abandoned-cart reminder emails:
--  - cart_email: maps an anonymous cart (the pongolux_cart_id cookie) to an
--    email address, captured on the cart page (or automatically for a
--    signed-in shopper's session email).
--  - abandoned_cart_reminder: records which expired reservation holds
--    already got a reminder email, keyed by (product_id, reserved_until) so
--    the same hold is never reminded about twice, even if the reminder job
--    runs many times before that hold changes (it's checked lazily, so a
--    stale expired hold can otherwise sit unchanged for a long time).
--
-- Run this in Neon's SQL Editor (or your Postgres client of choice)
-- against production BEFORE deploying the code that reads/writes these
-- tables.

CREATE TABLE IF NOT EXISTS "cart_email" (
  "cart_id" text PRIMARY KEY,
  "email" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "abandoned_cart_reminder" (
  "id" text PRIMARY KEY,
  "product_id" text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "cart_id" text NOT NULL,
  "reserved_until" timestamp NOT NULL,
  "sent_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "abandoned_cart_reminder_product_hold_idx"
  ON "abandoned_cart_reminder" ("product_id", "reserved_until");
