// lib/db/client.ts
// Real Postgres access (Neon serverless) for the Traductor demo. The schema is
// isolated under the "traductor" Postgres schema so sibling projects can share
// the same database without table collisions.

import { neon } from "@neondatabase/serverless";

export const DB_SCHEMA = "traductor";
export const TABLES = ["customers", "orders", "payments"] as const;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

/** Rewrite unqualified table names to schema-qualified (traductor.customers). */
export function qualify(sql: string): string {
  let out = sql;
  for (const t of TABLES) {
    out = out.replace(new RegExp(`\\b${t}\\b`, "g"), `${DB_SCHEMA}.${t}`);
  }
  return out;
}
