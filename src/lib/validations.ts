import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  email: z.email("Please enter a valid email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
});

export const LoginSchema = z.object({
  email: z.email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

// Matches the enums on the `product`/`authentication_record` tables in
// src/db/schema.ts — kept in sync manually since Drizzle doesn't export
// these as standalone zod enums.
export const PRODUCT_CATEGORIES = [
  "handbag",
  "wallet",
  "accessory",
  "other",
] as const;
export const PRODUCT_CONDITIONS = [
  "new",
  "like_new",
  "excellent",
  "very_good",
  "good",
  "fair",
] as const;
export const PRODUCT_STATUSES = [
  "available",
  "reserved",
  "sold",
  "archived",
] as const;
export const AUTH_METHODS = [
  "entrupy",
  "in_house_expert",
  "real_authentication",
  "other",
] as const;
export const ORDER_STATUSES = [
  "pending",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
] as const;

export const ProductFormSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "SKU is required.")
    .regex(
      /^[A-Za-z0-9-]+$/,
      "SKU can only contain letters, numbers, and hyphens."
    ),
  brand: z.string().trim().min(1, "Brand is required."),
  model: z.string().trim().min(1, "Model is required."),
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().min(1, "Description is required."),
  // Both optional: shown as their own labeled sections on the product page
  // only when filled in.
  conditionNotes: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  dimensions: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  color: z.string().trim().min(1, "Color is required."),
  category: z.enum(PRODUCT_CATEGORIES),
  condition: z.enum(PRODUCT_CONDITIONS),
  priceUsd: z.coerce
    .number()
    .positive("Price must be a positive number."),
  // Blank = not on sale. When set (and higher than priceUsd), the item
  // shows a strikethrough price and appears in /shop/price-drops — see
  // isOnSale() in src/lib/products.ts.
  compareAtPriceUsd: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (!isNaN(Number(v)) && Number(v) > 0),
      "Compare-at price must be a positive number, or left blank."
    )
    .transform((v) => (v === "" ? null : Number(v))),
  isConsignment: z.boolean().default(false),
  isMostWanted: z.boolean().default(false),
  authMethod: z.enum(AUTH_METHODS),
  authenticatedBy: z.string().trim().min(1, "Enter who authenticated this piece."),
  // Per-item link to that piece's own live cert.entrupy.com verification
  // page. Optional — older listings won't have one yet.
  certificateUrl: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine(
      (v) => v === null || /^https:\/\/(www\.)?(cert\.)?entrupy\.com\//.test(v),
      "Certificate link must be an entrupy.com URL."
    ),
});

// Bulk import (src/app/admin/products/bulk, src/lib/actions/bulk-import.ts)
// — one row of product-intake-template.csv. Deliberately reuses the exact
// same field rules as ProductFormSchema (same SKU regex, same positive-price
// check, etc.) so a listing behaves identically whether it was created one
// at a time through "New listing" or in a batch here — just without the
// per-item authentication fields, since bulk rows always use the same
// Entrupy default (matching scripts/import-products.ts's long-standing
// behavior) rather than asking for it per row.
export const BulkImportRowSchema = z.object({
  sku: ProductFormSchema.shape.sku,
  brand: ProductFormSchema.shape.brand,
  model: ProductFormSchema.shape.model,
  title: ProductFormSchema.shape.title,
  description: ProductFormSchema.shape.description,
  // All three optional, same as on the single-item form — blank stays null.
  conditionNotes: ProductFormSchema.shape.conditionNotes,
  dimensions: ProductFormSchema.shape.dimensions,
  category: ProductFormSchema.shape.category,
  color: ProductFormSchema.shape.color,
  condition: ProductFormSchema.shape.condition,
  priceUsd: ProductFormSchema.shape.priceUsd,
  compareAtPriceUsd: ProductFormSchema.shape.compareAtPriceUsd,
  isConsignment: z.boolean().default(false),
});

export const CONTACT_ATTENTION_OPTIONS = [
  "General Inquiry",
  "Order Support",
  "Consignment",
  "Press / Marketing",
] as const;

export const ContactFormSchema = z.object({
  attention: z.enum(CONTACT_ATTENTION_OPTIONS),
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  email: z.email("Please enter a valid email."),
  message: z
    .string()
    .trim()
    .min(5, "Please enter a message of at least 5 characters."),
});

export const ShippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the recipient's full name."),
  line1: z.string().trim().min(3, "Enter a street address."),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "Enter a city."),
  state: z.string().trim().min(2, "Enter a state."),
  postalCode: z.string().trim().min(3, "Enter a postal code."),
  country: z.string().trim().default("US"),
  phone: z.string().trim().optional(),
});

// ---------------------------------------------------------------------------
// Sell to us
// ---------------------------------------------------------------------------

// Matches the enum on the `sell_submission` table in src/db/schema.ts.
export const SELL_STATUSES = [
  "submitted",
  "under_review",
  "quote_sent",
  "accepted",
  "declined",
  "paid",
  "withdrawn",
] as const;

export const QUOTE_TYPES = ["buy_now", "consign"] as const;

export const SellSubmissionSchema = z.object({
  contactName: z.string().trim().min(2, "Enter your full name."),
  contactEmail: z.email("Please enter a valid email."),
  contactPhone: z.string().trim().min(7, "Enter a phone number we can reach you at."),
  addressLine1: z.string().trim().min(3, "Enter a street address."),
  addressLine2: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  city: z.string().trim().min(1, "Enter a city."),
  state: z.string().trim().min(2, "Enter a state."),
  postalCode: z.string().trim().min(3, "Enter a postal code."),
  country: z.string().trim().min(1).default("US"),
  productName: z.string().trim().min(1, "Enter the product name."),
  brand: z.string().trim().min(1, "Enter the brand."),
  yearOfPurchase: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  condition: z.enum(PRODUCT_CONDITIONS),
  size: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  proofOfAuthenticityUrl: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  notes: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
});

// Enforced separately from the schema above (rather than as a zod array
// length rule) since photos arrive as raw File entries from FormData —
// see submitSellSubmissionAction in src/lib/actions/sell.ts.
export const SELL_SUBMISSION_MIN_PHOTOS = 6;

// ---------------------------------------------------------------------------
// Bag of Dreams
// ---------------------------------------------------------------------------

// Matches the enum on the `dream_inquiry` table in src/db/schema.ts.
export const DREAM_STATUSES = [
  "submitted",
  "searching",
  "matched",
  "closed",
] as const;

export const CONTACT_PREFERENCES = ["call", "email", "either"] as const;

export const DreamInquirySchema = z.object({
  brand: z.string().trim().min(1, "Tell us the brand you're dreaming of."),
  modelOrStyle: z.string().trim().min(1, "Tell us the model or style."),
  colorPreference: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  sizePreference: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  budgetRange: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  occasion: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  details: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  contactPreference: z.enum(CONTACT_PREFERENCES).default("either"),
});
