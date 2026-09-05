import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
  credentials as credentialsTable,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Only registered when credentials are configured, so a fresh clone
    // without a Google OAuth app still boots cleanly.
    ...(process.env.AUTH_GOOGLE_ID
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // `passwordHash` is stored out-of-band (see signup action) since the
        // Auth.js user table doesn't have a password column by default.
        if (!user) return null;
        const valid = await verifyPassword(email, password);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

// --- Password auth helpers -------------------------------------------------
// Auth.js's shipped schema has no password column, so credential passwords
// are hashed and kept in a small side table (see src/db/schema.ts ->
// `credentials`) rather than bolted onto the `user` table.

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(email: string, password: string) {
  const [row] = await db
    .select()
    .from(credentialsTable)
    .where(eq(credentialsTable.email, email))
    .limit(1);
  if (!row) return false;
  return bcrypt.compare(password, row.passwordHash);
}
