import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __pongoluxSql: ReturnType<typeof postgres> | undefined;
}

// Reuse the connection across hot reloads in dev so we don't exhaust the
// Postgres connection pool every time a file is edited.
const sql =
  globalThis.__pongoluxSql ??
  postgres(process.env.DATABASE_URL ?? "", { max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pongoluxSql = sql;
}

export const db = drizzle(sql, { schema });
