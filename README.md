# PongoLux — Website (Phase 1 MVP)

An authenticated designer-handbag e-commerce storefront, built with Next.js
16 (App Router), Drizzle ORM + Postgres, Auth.js, and Stripe Checkout.

This is Phase 1 from the project roadmap: a working storefront MVP. See the
"What's next" section below for what's intentionally not built yet.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Drizzle ORM** + **Postgres** for the database (see "Why Drizzle, not
  Prisma" below)
- **Auth.js (NextAuth v5)** for customer accounts (email/password today;
  Google OAuth ready to enable)
- **Stripe Checkout** (hosted payment page — Stripe collects shipping
  address and card details, so this app never touches card data)
- **Zustand** for the client-side cart, persisted to `localStorage`
- **Resend** for transactional email (order confirmations)

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in real values (see
   "Environment variables" below). At minimum you need `DATABASE_URL` to run
   the app at all.
3. Push the schema to your database:
   ```bash
   npm run db:push
   ```
4. Seed sample listings (placeholder photos, real product data structure):
   ```bash
   npm run db:seed
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```

## Environment variables

See `.env.example` for the full list with comments. Summary of where to get
each one:

- `DATABASE_URL` — a Postgres connection string. [Neon](https://neon.tech)
  or [Supabase](https://supabase.com) both have generous free tiers and work
  well with Vercel.
- `AUTH_SECRET` — generate with `npx auth secret`.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — optional; only needed if you want
  "Sign in with Google". Leave blank to only offer email/password.
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from the
  Stripe Dashboard (Developers → API keys). Use test-mode keys until launch.
- `STRIPE_WEBHOOK_SECRET` — from the webhook endpoint you create in the
  Stripe Dashboard pointing at `/api/webhooks/stripe` (or via `stripe
  listen --forward-to localhost:3000/api/webhooks/stripe` in dev).
- `RESEND_API_KEY` — from [resend.com](https://resend.com). Order
  confirmation emails are skipped (logged to console) if this is unset.
- `NEXT_PUBLIC_SITE_URL` — your deployed URL; used to build Stripe redirect
  links and (later) email links.

## Why Drizzle, not Prisma

The original tech plan called for Prisma. During setup, Prisma's engine
binary download (`binaries.prisma.sh`) was unreachable from this build
environment's network. Rather than build on an ORM I couldn't verify end to
end, I switched to **Drizzle ORM**, which is pure TypeScript with no native
binary to fetch — and is a legitimately strong, modern choice on its own
merits (lighter weight, SQL-like query builder, first-class Auth.js
adapter). If you'd strongly prefer Prisma once you're building somewhere
with unrestricted network access, the schema in `src/db/schema.ts` maps
over fairly directly.

`drizzle-kit push` (used above) is meant for rapid iteration — it diffs
your schema against the database directly. Before production, switch to the
migration-file workflow instead (`npm run db:generate` to create a
migration, then apply it in your deploy pipeline) so schema changes are
reviewable and repeatable.

## How the one-of-one inventory model works

Unlike typical e-commerce, each handbag is unique — there's exactly one of
it. `products.status` is `available | reserved | sold | archived`. Adding an
item to a cart calls `reserveProductAction` (`src/lib/actions/cart.ts`),
which flips it to `reserved` and stamps `reservedUntil` (15 minutes out) and
`reservedByCartId` (an anonymous ID stored in a cookie, not tied to login).
A second shopper trying to add the same item gets a clear "someone else has
this in their cart" message. If a cart is abandoned, the hold simply expires
— the next read treats `reservedUntil < now` as available again, no
background job required. The Stripe webhook (`/api/webhooks/stripe`) flips
the item to `sold` once payment actually succeeds.

## Placeholder content — replace before launch

Several things in this codebase are deliberately placeholder, pending real
input from you:

- **Branding**: `src/app/globals.css` has a neutral ivory/charcoal/brass
  palette and uses system font stacks (see the comment in `layout.tsx` for
  why — it avoids a build-time dependency on Google's font CDN). Swap the
  CSS custom properties once PongoLux's logo, colors, and typography are
  final.
- **Product photos**: the seed script (`scripts/seed.ts`) uses
  `picsum.photos` placeholder images. Replace with real product photography
  hosted on Cloudinary/Cloudflare R2/S3 (update `next.config.ts`
  `images.remotePatterns` accordingly).
- **`/shipping-returns` page**: has placeholder copy — needs PongoLux's real
  policy.
- **Authentication method labels** (`src/lib/format.ts`): currently lists
  in-house expert, Entrupy, and Real Authentication as options — confirm
  which service(s) PongoLux actually uses.

## What's next (from the project roadmap)

Built in this pass (Phase 1 MVP): browsing/filtering, product detail with
authenticity badge, cart with reservation logic, Stripe Checkout, order
confirmation email + webhook, email/password accounts with order history.

Not yet built:

- Admin interface for adding/editing listings (currently only via the seed
  script or direct DB access)
- Search
- Wishlist
- SEO metadata pass, sitemap, robots.txt
- Production migration workflow (see "Why Drizzle" above)
- The React Native mobile app (Phase 4 of the roadmap)

## Useful scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run db:push` — push schema changes to the database (dev)
- `npm run db:generate` — generate a SQL migration file (production workflow)
- `npm run db:studio` — open Drizzle Studio, a GUI for browsing your data
- `npm run db:seed` — insert sample listings
