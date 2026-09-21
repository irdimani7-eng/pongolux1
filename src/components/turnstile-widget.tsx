"use client";

import Script from "next/script";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare Turnstile's "prove you're not a bot" check — free, and
 * usually invisible to a real visitor (Cloudflare only shows an actual
 * puzzle when something looks suspicious, unlike old-style reCAPTCHA).
 * Place this INSIDE a <form> — Cloudflare's script auto-renders any
 * .cf-turnstile element it finds and adds a hidden
 * "cf-turnstile-response" field next to it, which is what the matching
 * Server Action reads via verifyTurnstileToken() in src/lib/turnstile.ts.
 *
 * Renders nothing at all when NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set —
 * so the form looks and behaves exactly as it did before this component
 * existed until Irdi actually creates a free Cloudflare Turnstile site and
 * adds that key (plus the matching server-side secret) to Vercel.
 */
export function TurnstileWidget() {
  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <div className="cf-turnstile" data-sitekey={SITE_KEY} />
    </>
  );
}
