import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

/**
 * IP-based rate limiting for the site's public, unauthenticated entry
 * points: login, signup, and the contact form. Backed by Upstash Redis
 * rather than in-memory state, since Vercel's serverless functions don't
 * share memory between invocations — an in-memory counter would reset on
 * basically every request and never actually limit anything.
 *
 * Deliberately silent/inert until UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set: `redis` is null until then, and every
 * check below short-circuits to "allowed" in that case. This means the
 * site behaves exactly as it did before this file existed until Irdi
 * actually creates a free Upstash database and adds those two env vars to
 * Vercel — nothing breaks or blocks real visitors in the meantime.
 *
 * Also fails OPEN on any runtime error talking to Upstash (a network
 * hiccup, an outage) — a rate limiter that fails closed would mean a
 * Redis blip locks every real customer out of login/signup/contact, which
 * is a worse outcome than temporarily having no rate limit at all.
 */

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Limits chosen per form, based on what a real visitor would plausibly do
// versus what only a script would do:
// - login: 10 attempts / 10 minutes — generous enough for someone who
//   mistyped their password a few times, tight enough to make credential
//   stuffing impractical.
// - signup: 5 accounts / hour — nobody legitimately creates more than a
//   couple of accounts an hour from one IP.
// - contact: 5 messages / hour — same reasoning, stops a contact-form
//   spam bot without affecting a real customer sending one message.
const limiters = redis
  ? {
      login: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "10 m"),
        prefix: "ratelimit:login",
      }),
      signup: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        prefix: "ratelimit:signup",
      }),
      contact: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        prefix: "ratelimit:contact",
      }),
    }
  : null;

export type RateLimitedAction = "login" | "signup" | "contact";

/** Reads the visitor's real IP from the headers Vercel's edge network sets
 * on every request. `x-forwarded-for` can carry a comma-separated chain
 * (client, proxy, proxy...) when a request passes through more than one
 * hop — the first entry is the original client. Falls back to a constant
 * string (rather than throwing) if neither header is present, which would
 * only happen in an unusual local/dev setup — worst case everyone sharing
 * that fallback shares one rate-limit bucket locally, never in production. */
async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Checks whether the current visitor (by IP) is still within the limit for
 * the given action. Returns `{ allowed: true }` whenever rate limiting is
 * unconfigured or Upstash itself errors out — see the fail-open reasoning
 * in the file comment above. Call this before doing any real work in a
 * Server Action, and stop with a clear error message if `allowed` is false.
 */
export async function checkRateLimit(
  action: RateLimitedAction
): Promise<{ allowed: boolean }> {
  if (!limiters) return { allowed: true };

  try {
    const ip = await getClientIp();
    const { success } = await limiters[action].limit(`${action}:${ip}`);
    return { allowed: success };
  } catch (err) {
    console.error(`Rate limit check failed for "${action}" — failing open`, err);
    return { allowed: true };
  }
}
