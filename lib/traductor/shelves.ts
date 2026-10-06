// lib/traductor/shelves.ts
// How much of the catalog the librarian knows: the real generator and guard run
// against a schema trimmed to the first k tables. Mirrors backend/src/traductor/shelves.py.

import { generate } from "./generate";
import { exactMatch } from "./normalize";
import { validateSql } from "./validate";
import type { Question, Schema } from "./types";

export type ShelfStatus = "served" | "rerouted" | "lost";
export const SHELF_ORDER = ["customers", "orders", "payments"] as const;

export function trimSchema(schema: Schema, k: number): Schema {
  const keep = SHELF_ORDER.slice(0, k);
  return { tables: Object.fromEntries(Object.entries(schema.tables).filter(([t]) => (keep as readonly string[]).includes(t))) };
}

/** served: valid SQL with the gold answer; rerouted: the template or the guard refused; lost: valid SQL, wrong answer. */
export function shelfOutcomes(questions: readonly Question[], schema: Schema, k: number = SHELF_ORDER.length): ShelfStatus[] {
  if (!Number.isSafeInteger(k) || k < 0 || k > SHELF_ORDER.length) throw new Error("k must be 0 to 3 tables.");
  const known = trimSchema(schema, k);
  return questions.map(q => {
    let sql: string;
    try { sql = generate(q, known); } catch { return "rerouted"; }
    if (!validateSql(sql, known).ok) return "rerouted";
    return exactMatch(sql, q.sql) ? "served" : "lost";
  });
}
