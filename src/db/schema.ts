import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ---------------------------------------------------------------------------
// Auth.js tables (shape required by @auth/drizzle-adapter's Postgres adapter)
// ---------------------------------------------------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // Custom fields for PongoLux, layered onto the Auth.js user table.
  role: text("role", { enum: ["customer", "admin"] })
    .notNull()
    .default("customer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

// Auth.js's shipped user table has no password column. Credential-based
// signups store their hash here instead, keyed by email.
export const credentials = pgTable("credential", {
  email: text("email").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
});

// ---------------------------------------------------------------------------
// Catalog: every handbag is a unique, individually authenticated item — not a
// multi-quantity SKU. `status` + the reservation fields below prevent two
// shoppers from checking out the same one-of-one piece.
// ---------------------------------------------------------------------------

export const products = pgTable(
  "product",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // The SKU is Irdi's own inventory identifier and doubles as the
    // product page's URL segment (/product/<sku>) — see src/lib/products.ts.
    sku: text("sku").notNull(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    color: text("color").notNull(),
    category: text("category", {
      enum: ["handbag", "wallet", "accessory", "other"],
    })
      .notNull()
      .default("handbag"),
    condition: text("condition", {
      enum: ["new", "like_new", "excellent", "very_good", "good", "fair"],
    }).notNull(),
    priceCents: integer("price_cents").notNull(),
    // The pre-markdown price. When set and higher than priceCents, the item
    // is "on sale" — drives both the strikethrough price on the product
    // card/page and the /shop/price-drops collection (see src/lib/products.ts
    // isOnSale()). Null means never marked down.
    compareAtPriceCents: integer("compare_at_price_cents"),
    currency: text("currency").notNull().default("usd"),
    status: text("status", {
      enum: ["available", "reserved", "sold", "archived"],
    })
      .notNull()
      .default("available"),
    isConsignment: boolean("is_consignment").notNull().default(false),
    // Manual curation flag for the /shop/most-wanted collection — an admin
    // picks these, it isn't computed from views/sales.
    isMostWanted: boolean("is_most_wanted").notNull().default(false),
    // Lazy reservation: set when an item is added to a cart. Treated as
    // available again once this timestamp passes, without needing a cron job.
    reservedUntil: timestamp("reserved_until"),
    reservedByCartId: text("reserved_by_cart_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_sku_idx").on(table.sku),
    // Titles must be unique per listing (each bag is one-of-one) — if two
    // similar items collide, add a distinguishing detail to the title.
    uniqueIndex("product_title_idx").on(table.title),
  ]
);

export const productImages = pgTable(
  "product_image",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    position: integer("position").notNull().default(0),
  },
  (table) => [index("product_image_product_id_idx").on(table.productId)]
);

// One authentication record per product: who/how it was verified authentic.
export const authenticationRecords = pgTable("authentication_record", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .unique()
    .references(() => products.id, { onDelete: "cascade" }),
  method: text("method", {
    enum: ["in_house_expert", "entrupy", "real_authentication", "other"],
  }).notNull(),
  authenticatedBy: text("authenticated_by").notNull(),
  certificateUrl: text("certificate_url"),
  authenticatedAt: timestamp("authenticated_at").notNull().defaultNow(),
  notes: text("notes"),
});

// ---------------------------------------------------------------------------
// Orders & shipping
// ---------------------------------------------------------------------------

export const addresses = pgTable("address", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("US"),
  phone: text("phone"),
});

export const orders = pgTable("order", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  status: text("status", {
    enum: [
      "pending",
      "paid",
      "fulfilled",
      "cancelled",
      "refunded",
    ],
  })
    .notNull()
    .default("pending"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull().default(0),
  // Set from Stripe Tax's actual calculation once the webhook confirms
  // payment (see STRIPE_TAX_ENABLED in checkout.ts) — 0 until then, and
  // permanently 0 for any order placed before tax collection was turned on.
  taxCents: integer("tax_cents").notNull().default(0),
  // Pre-tax at order creation (subtotal + shipping); overwritten with
  // Stripe's authoritative charged amount (including tax) once payment is
  // confirmed via webhook.
  totalCents: integer("total_cents").notNull(),
  shippingAddressId: text("shipping_address_id").references(
    () => addresses.id
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  // Snapshotted at purchase time so the order record survives price/listing
  // edits (or the product being deleted) after the sale.
  titleSnapshot: text("title_snapshot").notNull(),
  priceCentsSnapshot: integer("price_cents_snapshot").notNull(),
  imageUrlSnapshot: text("image_url_snapshot"),
  quantity: integer("quantity").notNull().default(1),
});

// ---------------------------------------------------------------------------
// Relations (used by Drizzle's query API for ergonomic nested selects)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  addresses: many(addresses),
}));

export const productsRelations = relations(products, ({ many, one }) => ({
  images: many(productImages),
  authentication: one(authenticationRecords, {
    fields: [products.id],
    references: [authenticationRecords.productId],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  shippingAddress: one(addresses, {
    fields: [orders.shippingAddressId],
    references: [addresses.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
