-- Migration 008: Sell to Us
--
-- Adds tables backing the new "Sell your bag to us" flow: one row per
-- customer submission (contact info, item details, and Irdi's quote once
-- she's reviewed it), plus a child table for the submission's photos
-- (mirrors how product photos work in `product_image`).
--
-- Run this in Neon's SQL Editor (or your Postgres client of choice)
-- against production BEFORE deploying the code that reads/writes these
-- tables — the app fails closed (empty results) if it's missing, but the
-- submission form itself will error until this exists.

CREATE TABLE IF NOT EXISTS "sell_submission" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  -- Contact/shipping details for this specific submission — kept separate
  -- from any saved account address, since a seller may want pickup or
  -- return shipping to go somewhere else.
  "contact_name" text NOT NULL,
  "contact_email" text NOT NULL,
  "contact_phone" text NOT NULL,
  "address_line1" text NOT NULL,
  "address_line2" text,
  "city" text NOT NULL,
  "state" text NOT NULL,
  "postal_code" text NOT NULL,
  "country" text NOT NULL DEFAULT 'US',
  -- Item details
  "product_name" text NOT NULL,
  "brand" text NOT NULL,
  "year_of_purchase" text,
  "condition" text NOT NULL,
  "size" text,
  "proof_of_authenticity_url" text,
  "notes" text,
  -- Review/quote workflow. No dedicated admin UI yet (Irdi reviews new
  -- submissions by email) — update these columns directly here in the SQL
  -- editor as a submission moves through review, e.g.:
  --   UPDATE "sell_submission"
  --   SET status = 'quote_sent', quote_type = 'buy_now',
  --       quote_amount_cents = 85000, quote_notes = 'Offer valid 7 days.'
  --   WHERE id = '<id>';
  -- Valid status values: submitted, under_review, quote_sent, accepted,
  -- declined, paid, withdrawn.
  -- Valid quote_type values: buy_now, consign.
  "status" text NOT NULL DEFAULT 'submitted',
  "quote_type" text,
  "quote_amount_cents" integer,
  "quote_notes" text,
  "admin_notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sell_submission_user_id_idx"
  ON "sell_submission" ("user_id");

CREATE TABLE IF NOT EXISTS "sell_submission_photo" (
  "id" text PRIMARY KEY,
  "sell_submission_id" text NOT NULL
    REFERENCES "sell_submission"("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "position" integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "sell_submission_photo_submission_id_idx"
  ON "sell_submission_photo" ("sell_submission_id");
