-- New table capturing newsletter signups from the site footer. No email
-- marketing tool (Mailchimp/Klaviyo/Resend Audiences) is wired up yet —
-- this just makes sure signups aren't lost while that decision is pending.
CREATE TABLE "newsletter_subscriber" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now()
);
