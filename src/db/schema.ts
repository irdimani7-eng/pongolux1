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
    // Optional, separate from `description` — shown as their own labeled
    // sections on the product page (Condition / Size) instead of being
    // folded into one paragraph. Null/blank means that section is simply
    // omitted from the page, so older listings without this data still
    // render fine.
    conditionNotes: text("condition_notes"),
    dimensions: text("dimensions"),
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
  // Optional — set by an admin from /admin/orders/[id] when marking an
  // order Fulfilled. Included in the "your order has shipped" email when
  // present; the email still sends without one, just without a tracking
  // link.
  trackingNumber: text("tracking_number"),
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
  wishlistItems: many(wishlistItems),
  sellSubmissions: many(sellSubmissions),
  dreamInquiries: many(dreamInquiries),
}));

export const productsRelations = relations(products, ({ many, one }) => ({
  images: many(productImages),
  authentication: one(authenticationRecords, {
    fields: [products.id],
    references: [authenticationRecords.productId],
  }),
  wishlistItems: many(wishlistItems),
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

// ---------------------------------------------------------------------------
// Newsletter — simple email capture, no ESP (Mailchimp/Klaviyo/Resend
// Audiences) wired up yet. Storing signups here means nothing is lost
// while that tool decision is still pending; exporting this list later is
// a one-query job.
// ---------------------------------------------------------------------------

export const newsletterSubscribers = pgTable("newsletter_subscriber", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Wishlist — signed-in shoppers can save a one-of-one piece for later.
// Requires an account (unlike the cart, which works anonymously off a
// cookie) since the whole point is finding it again on a future visit.
// ---------------------------------------------------------------------------

export const wishlistItems = pgTable(
  "wishlist_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // A shopper can only save a given piece once — toggling the heart again
    // removes it rather than creating a duplicate row.
    uniqueIndex("wishlist_item_user_product_idx").on(
      table.userId,
      table.productId
    ),
    index("wishlist_item_user_id_idx").on(table.userId),
  ]
);

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, { fields: [wishlistItems.userId], references: [users.id] }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));

// ---------------------------------------------------------------------------
// Sell to us — a signed-in customer submits a handbag they'd like to sell.
// Irdi reviews new submissions by email (no dedicated admin queue yet — see
// migration-008-sell-submissions.sql) and, if interested, sends a quote for
// either an outright "Buy Now" purchase or a "Consign" listing. Status and
// the quote fields are updated directly in the database until an admin UI
// exists for this.
// ---------------------------------------------------------------------------

export const sellSubmissions = pgTable(
  "sell_submission",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Contact/shipping details for this specific submission — kept
    // independent of any saved account address, since a seller may want
    // pickup/return shipping to go somewhere else.
    contactName: text("contact_name").notNull(),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("US"),
    // Item details
    productName: text("product_name").notNull(),
    brand: text("brand").notNull(),
    yearOfPurchase: text("year_of_purchase"),
    condition: text("condition", {
      enum: ["new", "like_new", "excellent", "very_good", "good", "fair"],
    }).notNull(),
    size: text("size"),
    proofOfAuthenticityUrl: text("proof_of_authenticity_url"),
    notes: text("notes"),
    status: text("status", {
      enum: [
        "submitted",
        "under_review",
        "quote_sent",
        "accepted",
        "declined",
        "paid",
        "withdrawn",
      ],
    })
      .notNull()
      .default("submitted"),
    // Buy Now pays promptly on acceptance; Consign pays 7–10 days after the
    // item sells — see the copy on /sell and /account for how this is
    // explained to the seller.
    quoteType: text("quote_type", { enum: ["buy_now", "consign"] }),
    quoteAmountCents: integer("quote_amount_cents"),
    quoteNotes: text("quote_notes"),
    // Internal only — never shown to the customer.
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("sell_submission_user_id_idx").on(table.userId)]
);

export const sellSubmissionPhotos = pgTable(
  "sell_submission_photo",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sellSubmissionId: text("sell_submission_id")
      .notNull()
      .references(() => sellSubmissions.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    index("sell_submission_photo_submission_id_idx").on(
      table.sellSubmissionId
    ),
  ]
);

export const sellSubmissionsRelations = relations(
  sellSubmissions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [sellSubmissions.userId],
      references: [users.id],
    }),
    photos: many(sellSubmissionPhotos),
  })
);

export const sellSubmissionPhotosRelations = relations(
  sellSubmissionPhotos,
  ({ one }) => ({
    sellSubmission: one(sellSubmissions, {
      fields: [sellSubmissionPhotos.sellSubmissionId],
      references: [sellSubmissions.id],
    }),
  })
);

// ---------------------------------------------------------------------------
// Bag of Dreams — a signed-in customer tells us about a specific piece
// they're hunting for that isn't currently in stock. We check it against
// our vendor network and reach out personally (call or email) if we find a
// match.
// ---------------------------------------------------------------------------

export const dreamInquiries = pgTable(
  "dream_inquiry",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brand: text("brand").notNull(),
    modelOrStyle: text("model_or_style").notNull(),
    colorPreference: text("color_preference"),
    sizePreference: text("size_preference"),
    budgetRange: text("budget_range"),
    // Optional — "looking for this in time for our anniversary in June" —
    // lets us prioritize outreach and personalize it when we follow up.
    occasion: text("occasion"),
    details: text("details"),
    contactPreference: text("contact_preference", {
      enum: ["call", "email", "either"],
    })
      .notNull()
      .default("either"),
    status: text("status", {
      enum: ["submitted", "searching", "matched", "closed"],
    })
      .notNull()
      .default("submitted"),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("dream_inquiry_user_id_idx").on(table.userId)]
);

export const dreamInquiriesRelations = relations(dreamInquiries, ({ one }) => ({
  user: one(users, { fields: [dreamInquiries.userId], references: [users.id] }),
}));

// ---------------------------------------------------------------------------
// eBay integration — see src/lib/ebay.ts for the API client this backs.
// Single-seller app, so `ebay_connection` only ever holds one meaningful
// row (the most recently updated one is the one in use); it's still a
// table rather than a config value because the tokens are runtime state
// eBay hands back, not something we choose.
// ---------------------------------------------------------------------------

export const ebayConnections = pgTable("ebay_connection", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  environment: text("environment", {
    enum: ["sandbox", "production"],
  }).notNull(),
  // eBay's own identifier for the connected seller account — populated
  // once known, mainly so /admin can show "connected as ..." rather than
  // just a blind "connected" state.
  ebayUserId: text("ebay_user_id"),
  refreshToken: text("refresh_token").notNull(),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at").notNull(),
  // Cached short-lived access token, refreshed on demand once it's close to
  // expiring — see getValidAccessToken() in src/lib/ebay.ts. Nullable since
  // a freshly-stored connection (right after the OAuth callback) already
  // has one, but nothing stops it from being cleared/regenerated.
  accessToken: text("access_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  scopes: text("scopes").notNull(),
  // Watermark for the inbound order-sync poll (src/lib/ebay.ts,
  // syncEbayOrders) — only orders modified after this are fetched each
  // run, so a 15-minute (or daily, on Vercel's Hobby plan) poll doesn't
  // re-scan eBay's entire order history every time.
  lastOrderSyncAt: timestamp("last_order_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// One row per product that's ever been pushed to eBay. `status` reflects
// what PongoLux believes the eBay-side state is — kept in sync by the
// publish action, the Stripe-webhook-triggered withdraw (a website sale
// ends the eBay listing), and the order-polling job (an eBay sale marks
// the product sold on the website) — see src/lib/ebay.ts and the Stripe
// webhook route for where each of those lives.
export const ebayListings = pgTable(
  "ebay_listing",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .unique()
      .references(() => products.id, { onDelete: "cascade" }),
    // Same value as product.sku — eBay's Inventory API keys everything by
    // seller SKU, kept as its own column so a listing's identity doesn't
    // silently break if a product's SKU is ever edited after publishing.
    sku: text("sku").notNull(),
    offerId: text("offer_id"),
    ebayListingId: text("ebay_listing_id"),
    status: text("status", {
      enum: ["draft", "active", "ended", "error"],
    })
      .notNull()
      .default("draft"),
    // Set whenever an eBay API call in the publish/withdraw pipeline
    // fails, so a failure is visible on the product's admin edit page
    // instead of only in server logs. Cleared on the next successful call.
    lastError: text("last_error"),
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("ebay_listing_status_idx").on(table.status)]
);

export const ebayListingsRelations = relations(ebayListings, ({ one }) => ({
  product: one(products, {
    fields: [ebayListings.productId],
    references: [products.id],
  }),
}));
