import "server-only";
import { db } from "@/db";
import { ebayConnections, ebayListings, products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { sendEbaySaleNotificationEmail } from "@/lib/email";

/**
 * eBay Sell API client — OAuth token management, the inventory/offer
 * publish pipeline, and the withdraw call used when a website sale needs
 * to end a live eBay listing.
 *
 * IMPORTANT CONTEXT FOR WHOEVER TOUCHES THIS NEXT: this was written from
 * documented eBay Sell API shapes without a live eBay account to test
 * against in the sandbox this was built in — unlike the Google Merchant
 * Center feed (which was verified end-to-end the same day), nothing here
 * has actually round-tripped against eBay's real API yet. Treat the first
 * live attempt (ideally in EBAY_ENVIRONMENT=sandbox first) as a real test,
 * not a formality — read whatever error `publishProductToEbay` surfaces
 * carefully, since eBay's own validation is usually specific about what's
 * missing (a required item aspect for the category, a missing business
 * policy, etc.) and the fix is almost always a small, obvious one.
 *
 * One-time account-side prerequisites this code assumes are already done
 * in Irdi's eBay seller account (none of these can be done from here —
 * see the project doc for the full checklist):
 *   - eBay Developer Program keyset (App ID / Cert ID) + a registered
 *     redirect URI ("RuName"), in EBAY_APP_ID / EBAY_CERT_ID / EBAY_RU_NAME.
 *   - Business Policies opted into, with at least one payment/fulfillment/
 *     return policy each, in eBay Seller Hub.
 *   - At least one inventory location created (Seller Hub's shipping
 *     preferences normally creates a default one automatically once
 *     Business Policies are on).
 *   - The one-time OAuth consent flow completed via /admin/ebay (see
 *     src/app/api/ebay/connect and /callback) — that's what populates the
 *     ebay_connection row this file reads.
 */

type EbayEnvironment = "sandbox" | "production";

function getEbayConfig() {
  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  const ruName = process.env.EBAY_RU_NAME;
  const environment = (process.env.EBAY_ENVIRONMENT ?? "sandbox") as EbayEnvironment;

  if (!appId || !certId || !ruName) {
    throw new Error(
      "eBay isn't configured yet — set EBAY_APP_ID, EBAY_CERT_ID, and EBAY_RU_NAME in your environment variables (from your eBay Developer Program keyset)."
    );
  }

  const apiBase =
    environment === "production" ? "https://api.ebay.com" : "https://api.sandbox.ebay.com";
  const authBase =
    environment === "production"
      ? "https://auth.ebay.com"
      : "https://auth.sandbox.ebay.com";

  return { appId, certId, ruName, environment, apiBase, authBase };
}

// Scope identifiers are shared across sandbox/production — only the API
// and auth hostnames differ between environments.
const SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
];

/** Step 1 of the one-time OAuth connect flow — send the admin here (via
 * /api/ebay/connect) to grant this app access to their eBay seller
 * account. `state` should be a random value checked again in the callback
 * to guard against CSRF, same idea as any OAuth "state" param. */
export function getAuthorizationUrl(state: string): string {
  const { appId, ruName, authBase } = getEbayConfig();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: ruName,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
  });
  return `${authBase}/oauth2/authorize?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
};

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  const { appId, certId, apiBase } = getEbayConfig();
  const basicAuth = Buffer.from(`${appId}:${certId}`).toString("base64");

  const res = await fetch(`${apiBase}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`eBay token request failed (${res.status}): ${text}`);
  }
  return res.json();
}

/** Step 2 of the connect flow — the /api/ebay/callback route hands the
 * `code` eBay redirected back with to this, then stores the resulting
 * tokens as the (single) ebay_connection row. */
export async function connectWithAuthorizationCode(code: string) {
  const { ruName, environment } = getEbayConfig();
  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: ruName,
    })
  );
  if (!tokens.refresh_token || !tokens.refresh_token_expires_in) {
    throw new Error(
      "eBay didn't return a refresh token — double-check the requested scopes include offline access."
    );
  }

  const now = Date.now();
  // Only one connection is ever meaningful for this single-seller app;
  // clear any previous one (e.g. a sandbox connection being replaced by a
  // production one) rather than accumulating stale rows.
  await db.delete(ebayConnections);
  await db.insert(ebayConnections).values({
    environment,
    refreshToken: tokens.refresh_token,
    refreshTokenExpiresAt: new Date(now + tokens.refresh_token_expires_in * 1000),
    accessToken: tokens.access_token,
    accessTokenExpiresAt: new Date(now + tokens.expires_in * 1000),
    scopes: SCOPES.join(" "),
  });
}

async function getConnection() {
  const [connection] = await db
    .select()
    .from(ebayConnections)
    .orderBy(desc(ebayConnections.updatedAt))
    .limit(1);
  return connection ?? null;
}

/** Returns a currently-valid access token, refreshing it first if it's
 * expired or close to it. Every other function in this file that calls
 * eBay's API goes through this rather than touching stored tokens
 * directly. */
export async function getValidAccessToken(): Promise<string> {
  const connection = await getConnection();
  if (!connection) {
    throw new Error(
      "eBay isn't connected yet — an admin needs to complete the one-time connect flow at /admin/ebay first."
    );
  }

  const bufferMs = 2 * 60 * 1000; // refresh a couple minutes before it actually expires
  if (
    connection.accessToken &&
    connection.accessTokenExpiresAt &&
    connection.accessTokenExpiresAt.getTime() - bufferMs > Date.now()
  ) {
    return connection.accessToken;
  }

  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken,
      scope: SCOPES.join(" "),
    })
  );

  const accessTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  await db
    .update(ebayConnections)
    .set({ accessToken: tokens.access_token, accessTokenExpiresAt, updatedAt: new Date() })
    .where(eq(ebayConnections.id, connection.id));

  return tokens.access_token;
}

async function ebayFetch<T>(
  path: string,
  init: RequestInit & { marketplaceId?: string } = {}
): Promise<T> {
  const { apiBase } = getEbayConfig();
  const accessToken = await getValidAccessToken();
  const { marketplaceId, ...rest } = init;

  const res = await fetch(`${apiBase}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-EBAY-C-MARKETPLACE-ID": marketplaceId ?? "EBAY_US",
      ...rest.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message = body;
    try {
      const parsed = JSON.parse(body);
      message = parsed?.errors?.[0]?.longMessage ?? parsed?.errors?.[0]?.message ?? body;
    } catch {
      // body wasn't JSON — fall back to the raw text already assigned above
    }
    throw new Error(`eBay API call to ${path} failed (${res.status}): ${message}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------------------------------------------------------------------------
// Category resolution — asks eBay's own Taxonomy API rather than hardcoding
// a category ID, since a guessed ID risks silently landing a listing in
// the wrong (or a since-renumbered) category.
// ---------------------------------------------------------------------------

const CATEGORY_SEARCH_TERM: Record<string, string> = {
  handbag: "Handbags",
  wallet: "Wallets",
  accessory: "Clothing Accessories",
  other: "Handbags",
};

let cachedCategoryTreeId: string | null = null;

async function getCategoryTreeId(): Promise<string> {
  if (cachedCategoryTreeId) return cachedCategoryTreeId;
  const result = await ebayFetch<{ categoryTreeId: string }>(
    "/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_US"
  );
  cachedCategoryTreeId = result.categoryTreeId;
  return cachedCategoryTreeId;
}

/** Resolves a PongoLux product category to a live eBay category ID by
 * asking eBay's Taxonomy API for its own suggestion, instead of shipping
 * a hardcoded ID that could be wrong or go stale. Worth a manual sanity
 * check in Seller Hub the first time each category is used. */
export async function resolveCategoryId(productCategory: string): Promise<string> {
  const treeId = await getCategoryTreeId();
  const query = CATEGORY_SEARCH_TERM[productCategory] ?? "Handbags";
  const result = await ebayFetch<{
    categorySuggestions?: { category: { categoryId: string; categoryName: string } }[];
  }>(
    `/commerce/taxonomy/v1/category_tree/${treeId}/get_category_suggestions?q=${encodeURIComponent(query)}`
  );
  const top = result.categorySuggestions?.[0]?.category;
  if (!top) {
    throw new Error(
      `eBay's Taxonomy API returned no category suggestions for "${query}" — check the category manually in Seller Hub.`
    );
  }
  return top.categoryId;
}

// ---------------------------------------------------------------------------
// Business policies + inventory location — both are one-time account-side
// setup in eBay Seller Hub; this just reads whatever's there rather than
// creating anything, since guessing at business details (a mailing
// address, policy terms) isn't something to do on Irdi's behalf.
// ---------------------------------------------------------------------------

async function getFirstPolicyId(
  policyType: "payment_policy" | "fulfillment_policy" | "return_policy"
): Promise<string> {
  const result = await ebayFetch<{
    [key: string]: unknown;
  } & Record<string, { [key: string]: unknown }[]>>(
    `/sell/account/v1/${policyType}?marketplace_id=EBAY_US`
  );
  const listKey = Object.keys(result).find((k) => Array.isArray(result[k]));
  const list = listKey ? (result[listKey] as Record<string, unknown>[]) : [];
  const first = list[0];
  const id = first?.[
    policyType === "payment_policy"
      ? "paymentPolicyId"
      : policyType === "fulfillment_policy"
        ? "fulfillmentPolicyId"
        : "returnPolicyId"
  ];
  if (typeof id !== "string") {
    throw new Error(
      `No eBay ${policyType.replace("_", " ")} found — set up Business Policies in eBay Seller Hub (Account → Business Policies) before publishing a listing.`
    );
  }
  return id;
}

async function getDefaultMerchantLocationKey(): Promise<string> {
  const result = await ebayFetch<{ locations?: { merchantLocationKey: string }[] }>(
    "/sell/inventory/v1/location?limit=1"
  );
  const key = result.locations?.[0]?.merchantLocationKey;
  if (!key) {
    throw new Error(
      "No eBay inventory location found — create one in Seller Hub (Shipping preferences normally creates a default location automatically once Business Policies are on) before publishing a listing."
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// Condition mapping — PongoLux's 6-point scale collapsed to eBay's
// InventoryItem condition enum (fashion/general categories).
// ---------------------------------------------------------------------------

function toEbayCondition(condition: string): string {
  switch (condition) {
    case "new":
      return "NEW";
    case "like_new":
    case "excellent":
      return "USED_EXCELLENT";
    case "very_good":
      return "USED_VERY_GOOD";
    case "good":
      return "USED_GOOD";
    default:
      return "USED_ACCEPTABLE";
  }
}

export type EbayProductInput = {
  sku: string;
  title: string;
  description: string;
  brand: string;
  color: string;
  category: string;
  condition: string;
  priceCents: number;
  currency: string;
  imageUrls: string[];
};

async function createOrReplaceInventoryItem(product: EbayProductInput) {
  await ebayFetch(`/sell/inventory/v1/inventory_item/${encodeURIComponent(product.sku)}`, {
    method: "PUT",
    body: JSON.stringify({
      condition: toEbayCondition(product.condition),
      product: {
        // eBay titles are capped at 80 characters.
        title: product.title.slice(0, 80),
        description: product.description,
        aspects: {
          Brand: [product.brand],
          Color: [product.color],
        },
        imageUrls: product.imageUrls,
      },
      availability: {
        shipToLocationAvailability: { quantity: 1 },
      },
    }),
  });
}

async function createOffer(
  product: EbayProductInput,
  categoryId: string,
  policyIds: { paymentPolicyId: string; fulfillmentPolicyId: string; returnPolicyId: string },
  merchantLocationKey: string
): Promise<string> {
  const result = await ebayFetch<{ offerId: string }>("/sell/inventory/v1/offer", {
    method: "POST",
    body: JSON.stringify({
      sku: product.sku,
      marketplaceId: "EBAY_US",
      format: "FIXED_PRICE",
      availableQuantity: 1,
      categoryId,
      merchantLocationKey,
      listingDescription: product.description,
      listingPolicies: policyIds,
      pricingSummary: {
        price: {
          value: (product.priceCents / 100).toFixed(2),
          currency: product.currency.toUpperCase(),
        },
      },
    }),
  });
  return result.offerId;
}

async function publishOffer(offerId: string): Promise<string> {
  const result = await ebayFetch<{ listingId: string }>(
    `/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/publish`,
    { method: "POST" }
  );
  return result.listingId;
}

async function withdrawOffer(offerId: string) {
  await ebayFetch(`/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/withdraw`, {
    method: "POST",
  });
}

async function upsertListingRow(
  productId: string,
  sku: string,
  fields: Partial<{
    offerId: string | null;
    ebayListingId: string | null;
    status: "draft" | "active" | "ended" | "error";
    lastError: string | null;
    lastSyncedAt: Date;
  }>
) {
  const [existing] = await db
    .select({ id: ebayListings.id })
    .from(ebayListings)
    .where(eq(ebayListings.productId, productId))
    .limit(1);

  if (existing) {
    await db
      .update(ebayListings)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(ebayListings.productId, productId));
  } else {
    await db.insert(ebayListings).values({ productId, sku, status: "draft", ...fields });
  }
}

/** The full publish pipeline for one product: resolve category, read
 * existing business policies/location, create the inventory item, create
 * the offer, and publish it. Every step's outcome is reflected in the
 * product's ebay_listing row (including a failure partway through, so a
 * partially-completed attempt is visible rather than silently stuck). */
export async function publishProductToEbay(
  productId: string,
  product: EbayProductInput
): Promise<{ ok: true; ebayListingId: string } | { ok: false; error: string }> {
  try {
    const [categoryId, merchantLocationKey, paymentPolicyId, fulfillmentPolicyId, returnPolicyId] =
      await Promise.all([
        resolveCategoryId(product.category),
        getDefaultMerchantLocationKey(),
        getFirstPolicyId("payment_policy"),
        getFirstPolicyId("fulfillment_policy"),
        getFirstPolicyId("return_policy"),
      ]);

    await createOrReplaceInventoryItem(product);

    const offerId = await createOffer(
      product,
      categoryId,
      { paymentPolicyId, fulfillmentPolicyId, returnPolicyId },
      merchantLocationKey
    );
    await upsertListingRow(productId, product.sku, { offerId, status: "draft" });

    const ebayListingId = await publishOffer(offerId);
    await upsertListingRow(productId, product.sku, {
      ebayListingId,
      status: "active",
      lastError: null,
      lastSyncedAt: new Date(),
    });

    return { ok: true, ebayListingId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await upsertListingRow(productId, product.sku, {
      status: "error",
      lastError: message,
      lastSyncedAt: new Date(),
    });
    return { ok: false, error: message };
  }
}

/** Ends a product's live eBay listing. Called both from the admin "End
 * eBay listing" button and automatically from the Stripe webhook when the
 * item sells on the website — see src/app/api/webhooks/stripe/route.ts. */
export async function endEbayListingForProduct(
  productId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [listing] = await db
    .select()
    .from(ebayListings)
    .where(eq(ebayListings.productId, productId))
    .limit(1);

  if (!listing || listing.status !== "active" || !listing.offerId) {
    // Nothing live to end — not an error, just a no-op.
    return { ok: true };
  }

  try {
    await withdrawOffer(listing.offerId);
    await db
      .update(ebayListings)
      .set({ status: "ended", lastError: null, lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(ebayListings.productId, productId));
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(ebayListings)
      .set({ lastError: message, lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(ebayListings.productId, productId));
    return { ok: false, error: message };
  }
}

export async function getEbayListingForProduct(productId: string) {
  const [listing] = await db
    .select()
    .from(ebayListings)
    .where(eq(ebayListings.productId, productId))
    .limit(1);
  return listing ?? null;
}

export async function isEbayConnected(): Promise<boolean> {
  const connection = await getConnection();
  return connection !== null;
}

// ---------------------------------------------------------------------------
// Inbound order sync — the other direction from publishProductToEbay:
// catches a sale that happened *on* eBay and marks it sold on the website,
// so it can't also be bought there. Meant to be called on a schedule (see
// src/app/api/cron/ebay-orders/route.ts) rather than in response to a
// webhook — this session couldn't reliably verify eBay's current
// notification-topic naming against live docs, and polling the
// well-documented Fulfillment API is the safer thing to build without
// being able to test it live.
// ---------------------------------------------------------------------------

type EbayOrder = {
  orderId: string;
  lineItems?: { sku?: string }[];
};

/** Looks at every eBay order created since the last successful run,
 * matches line items back to a PongoLux product by SKU, and — for any
 * match that's still marked "active" on both sides — marks the product
 * sold, ends its ebay_listing record, and emails support@ so it actually
 * gets shipped (an eBay sale never touches /admin/orders, since it didn't
 * go through PongoLux's own checkout). Safe to call repeatedly; already-
 * processed orders are simply skipped because their listing is no longer
 * "active" the second time around. */
export async function syncEbayOrders(): Promise<
  { ok: true; processed: number } | { ok: false; error: string }
> {
  try {
    const connection = await getConnection();
    if (!connection) return { ok: true, processed: 0 };

    const since = connection.lastOrderSyncAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filter = encodeURIComponent(`creationdate:[${since.toISOString()}..]`);
    const result = await ebayFetch<{ orders?: EbayOrder[] }>(
      `/sell/fulfillment/v1/order?filter=${filter}&limit=50`
    );

    let processed = 0;
    for (const order of result.orders ?? []) {
      for (const lineItem of order.lineItems ?? []) {
        if (!lineItem.sku) continue;

        const [listing] = await db
          .select()
          .from(ebayListings)
          .where(eq(ebayListings.sku, lineItem.sku))
          .limit(1);
        if (!listing || listing.status !== "active") continue;

        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, listing.productId))
          .limit(1);
        if (!product || product.status === "sold") continue;

        await db
          .update(products)
          .set({ status: "sold", reservedUntil: null, reservedByCartId: null })
          .where(eq(products.id, product.id));
        await db
          .update(ebayListings)
          .set({ status: "ended", lastSyncedAt: new Date(), updatedAt: new Date() })
          .where(eq(ebayListings.productId, product.id));

        try {
          await sendEbaySaleNotificationEmail({
            productTitle: product.title,
            sku: product.sku,
            ebayOrderId: order.orderId,
          });
        } catch (err) {
          console.error("Failed to send eBay sale notification email for", product.sku, err);
        }

        processed++;
      }
    }

    await db
      .update(ebayConnections)
      .set({ lastOrderSyncAt: new Date(), updatedAt: new Date() })
      .where(eq(ebayConnections.id, connection.id));

    return { ok: true, processed };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
