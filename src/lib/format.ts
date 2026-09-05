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

export const AUTH_METHOD_LABELS: Record<string, string> = {
  in_house_expert: "In-house authentication expert",
  entrupy: "Entrupy",
  real_authentication: "Real Authentication",
  other: "Third-party authentication service",
};
