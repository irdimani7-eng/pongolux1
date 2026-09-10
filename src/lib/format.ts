// Shipping is free; insurance against loss/damage in transit is a flat
// optional add-on. See /shipping-returns for the full policy.
export const SHIPPING_INSURANCE_CENTS = 2000;

export function formatPrice(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  excellent: "Excellent",
  very_good: "Very Good",
  good: "Good",
  fair: "Fair",
};

export const CATEGORY_LABELS: Record<string, string> = {
  handbag: "Handbags",
  wallet: "Wallets",
  accessory: "Accessories",
  other: "Other",
};

// Fixed price buckets for the shop filter. `max: null` means "and up".
export const PRICE_RANGES = [
  { value: "under-500", label: "Under $500", min: 0, max: 50_000 },
  { value: "500-1500", label: "$500 – $1,500", min: 50_000, max: 150_000 },
  { value: "1500-3000", label: "$1,500 – $3,000", min: 150_000, max: 300_000 },
  { value: "3000-6000", label: "$3,000 – $6,000", min: 300_000, max: 600_000 },
  { value: "6000-plus", label: "$6,000+", min: 600_000, max: null },
] as const satisfies readonly {
  value: string;
  label: string;
  min: number;
  max: number | null;
}[];

export const AUTH_METHOD_LABELS: Record<string, string> = {
  in_house_expert: "In-house authentication expert",
  entrupy: "Entrupy",
  real_authentication: "Real Authentication",
  other: "Third-party authentication service",
};

export const SELL_STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted — awaiting review",
  under_review: "Under review",
  quote_sent: "Quote sent",
  accepted: "Quote accepted",
  declined: "Declined",
  paid: "Paid",
  withdrawn: "Withdrawn",
};

export const QUOTE_TYPE_LABELS: Record<string, string> = {
  buy_now: "Buy Now",
  consign: "Consign with us",
};

export const DREAM_STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted — we're on it",
  searching: "Searching our vendor network",
  matched: "Match found — we'll be in touch",
  closed: "Closed",
};

export const CONTACT_PREFERENCE_LABELS: Record<string, string> = {
  call: "Call me",
  email: "Email me",
  either: "Either is fine",
};
