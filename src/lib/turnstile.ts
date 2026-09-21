/**
 * Server-side verification for Cloudflare Turnstile — the free, usually-
 * invisible "prove you're not a bot" widget shown on login, signup, and the
 * contact form (see src/components/turnstile-widget.tsx for the widget
 * itself). The widget alone proves nothing on its own; a script could just
 * submit the form without ever loading Cloudflare's JS. The actual check
 * happens here, server-side, by handing the token the widget produced to
 * Cloudflare's own verification endpoint and trusting only its answer.
 *
 * Deliberately inert until TURNSTILE_SECRET_KEY is set — returns "verified"
 * for every submission until then, same reasoning as rate-limit.ts: this
 * file existing shouldn't change site behavior before Irdi actually creates
 * a free Cloudflare Turnstile site and adds both resulting keys
 * (NEXT_PUBLIC_TURNSTILE_SITE_KEY for the widget, TURNSTILE_SECRET_KEY for
 * this check) to Vercel.
 *
 * Also fails OPEN if Cloudflare's own verification API errors out or times
 * out — an outage on Cloudflare's end should never be the reason a real
 * customer can't sign in or send a message.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Turnstile response token from a submitted form. Pass
 * `formData.get("cf-turnstile-response")` — that's the hidden field name
 * Cloudflare's widget script fills in automatically once a visitor (or,
 * usually, nothing at all — Turnstile is mostly invisible) completes the
 * check.
 */
export async function verifyTurnstileToken(
  token: FormDataEntryValue | null
): Promise<{ ok: boolean }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return { ok: true }; // not configured yet — see file comment

  // If Turnstile IS configured but the form came in with no token at all,
  // that's not an outage or an edge case — it means the widget never ran
  // (most likely a script bypassing the browser entirely), so this should
  // fail rather than fail open.
  if (typeof token !== "string" || token.length === 0) {
    return { ok: false };
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretKey, response: token }),
      // Cloudflare's own endpoint is normally fast; a generous but bounded
      // timeout means a slow/hung request degrades to fail-open instead of
      // hanging the whole form submission indefinitely.
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await response.json()) as { success?: boolean };
    return { ok: data.success === true };
  } catch (err) {
    console.error("Turnstile verification request failed — failing open", err);
    return { ok: true };
  }
}
