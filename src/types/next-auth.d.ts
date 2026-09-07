import type { DefaultSession } from "next-auth";

// Adds our custom `role` field (see users.role in src/db/schema.ts) onto
// Auth.js's Session/JWT types so `session.user.role` type-checks everywhere
// (admin route guards, the header's conditional "Admin" link, etc).
//
// This next-auth version (v5 beta) re-exports Session/JWT from @auth/core
// rather than declaring them itself, so the augmentation has to target the
// module that actually declares the interface (@auth/core/types,
// @auth/core/jwt) — augmenting "next-auth"/"next-auth/jwt" alone doesn't
// reliably merge in every TS setup. Both are declared here to be safe.
declare module "next-auth" {
  interface Session {
    user: {
      role: "customer" | "admin";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "customer" | "admin";
  }
}

declare module "@auth/core/types" {
  interface Session {
    user: {
      role: "customer" | "admin";
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "customer" | "admin";
  }
}
