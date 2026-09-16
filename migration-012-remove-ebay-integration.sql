-- Migration 012: Remove eBay integration
--
-- eBay was never actually connected (no Developer Program account was ever
-- created, no OAuth connection was ever completed), and the decision has
-- been made not to pursue it. This drops the two tables added by
-- migration-010-ebay-integration.sql — safe to run any time, since neither
-- table has ever held real data.
--
-- Run this in Neon's SQL Editor against production, same as every other
-- migration in this project.

DROP TABLE IF EXISTS "ebay_listing";
DROP TABLE IF EXISTS "ebay_connection";
