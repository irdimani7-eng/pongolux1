import Stripe from "stripe";

// apiVersion is intentionally omitted so the SDK uses your Stripe account's
// configured default API version. Pin it explicitly once the account
// settings are finalized (Stripe Dashboard -> Developers -> API version).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  typescript: true,
});
