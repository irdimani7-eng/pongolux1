-- Migration 010: eBay integration
--
-- Adds the two tables backing the eBay Sell API integration (see
-- src/lib/ebay.ts): ebay_connection stores the OAuth tokens for the one
-- eBay seller account this app connects to, and ebay_listing tracks the
-- eBay-side state (offer ID, published listing ID, sync status/errors)
-- for every PongoLux product that's ever been pushed to eBay.
--
-- Run this in Neon's SQL Editor (or your Postgres client of choice)
-- against production BEFORE deploying the code that reads/writes these
-- tables.

CREATE TABLE IF NOT EXISTS "ebay_connection" (
  "id" text PRIMARY KEY,
  -- Valid values: sandbox, production.
  "environment" text NOT NULL,
  "ebay_user_id" text,
  "refresh_token" text NOT NULL,
  "refresh_token_expires_at" timestamp NOT NULL,
  "access_token" text,
  "access_token_expires_at" timestamp,
  "scopes" text NOT NULL,
  -- Watermark for the inbound order-sync poll — see syncEbayOrders() in
  -- src/lib/ebay.ts.
  "last_order_sync_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ebay_listing" (
  "id" text PRIMARY KEY,
  "product_id" text NOT NULL UNIQUE REFERENCES "product"("id") ON DELETE CASCADE,
  "sku" text NOT NULL,
  "offer_id" text,
  "ebay_listing_id" text,
  -- Valid values: draft, active, ended, error.
  "status" text NOT NULL DEFAULT 'draft',
  "last_error" text,
  "last_synced_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ebay_listing_status_idx"
  ON "ebay_listing" ("status");
