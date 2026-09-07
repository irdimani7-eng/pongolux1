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
  color: z.string().trim().min(1, "Color is required."),
  category: z.enum(PRODUCT_CATEGORIES),
  condition: z.enum(PRODUCT_CONDITIONS),
  priceUsd: z.coerce
    .number()
    .positive("Price must be a positive number."),
  isConsignment: z.boolean().default(false),
  authMethod: z.enum(AUTH_METHODS),
  authenticatedBy: z.string().trim().min(1, "Enter who authenticated this piece."),
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
