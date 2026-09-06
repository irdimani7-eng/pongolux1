import Stripe from "stripe";

// Constructing `new Stripe(...)` throws immediately if the key is empty, and
// Next.js evaluates this module at build time while analyzing every route
// (including /api/webhooks/stripe) even if that route is never hit -- so a
// missing STRIPE_SECRET_KEY must not throw here, or it takes down the whole
// build. Instead, the client is built lazily on first real use; callers
// (checkout, the webhook handler) already wrap their Stripe calls in
// try/catch and show a friendly "unavailable" message if this throws.
let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it in your environment variables to enable Stripe checkout."
    );
  }
  // apiVersion is intentionally omitted so the SDK uses your Stripe account's
  // configured default API version. Pin it explicitly once the account
  // settings are finalized (Stripe Dashboard -> Developers -> API version).
  cached ??= new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
  return cached;
}
