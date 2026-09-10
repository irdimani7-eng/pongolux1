-- Migration 009: Bag of Dreams
--
-- Adds the dream_inquiry table backing the new "Tell us about your bag of
-- dreams" page — a signed-in customer's request for a specific piece
-- that's not currently in stock, which Irdi checks against her vendor
-- network and follows up on personally.
--
-- Run this in Neon's SQL Editor (or your Postgres client of choice)
-- against production BEFORE deploying the code that reads/writes this
-- table.

CREATE TABLE IF NOT EXISTS "dream_inquiry" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "brand" text NOT NULL,
  "model_or_style" text NOT NULL,
  "color_preference" text,
  "size_preference" text,
  "budget_range" text,
  "occasion" text,
  "details" text,
  -- Valid values: call, email, either.
  "contact_preference" text NOT NULL DEFAULT 'either',
  -- No dedicated admin UI yet — update directly here as an inquiry
  -- progresses, e.g.:
  --   UPDATE "dream_inquiry" SET status = 'matched' WHERE id = '<id>';
  -- Valid status values: submitted, searching, matched, closed.
  "status" text NOT NULL DEFAULT 'submitted',
  "admin_notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "dream_inquiry_user_id_idx"
  ON "dream_inquiry" ("user_id");
