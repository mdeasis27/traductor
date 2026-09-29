// lib/traductor/validate.ts
// Hallucination detector + SELECT-only guardrail. Given a SQL string, it
// extracts every table and column reference and checks it against the schema.
// A "hallucination" is any reference that doesn't exist: an unknown table, an
// unknown column, or a non-SELECT statement (DDL/DML).
//
// This is a deterministic reference extractor — a documented proxy for a real
// SQL parser/planner, in the same way the lexical retriever was a proxy for
// embeddings. It is the safety net that runs before anything executes.

import { columnNames, hasColumn, hasTable, tableNames } from "./schema";
import { normalizeSql } from "./normalize";
import type { Schema, Verdict, Violation } from "./types";

const DML_DDL = new Set([
  "insert",
  "update",
  "delete",
  "drop",
  "alter",
  "create",
  "truncate",
  "merge",
  "grant",
  "revoke",
  "replace",
]);

const KEYWORDS = new Set([
  "select",
  "from",
  "where",
  "group",
  "by",
  "order",
  "limit",
  "offset",
  "join",
  "inner",
  "left",
  "right",
  "full",
  "outer",
  "cross",
  "on",
  "as",
  "and",
  "or",
  "not",
  "in",
  "between",
  "like",
  "ilike",
  "is",
  "null",
  "asc",
  "desc",
  "distinct",
  "all",
  "having",
  "union",
  "intersect",
  "except",
  "count",
  "sum",
  "avg",
  "min",
  "max",
  "case",
  "when",
  "then",
  "else",
  "end",
  "cast",
  "coalesce",
  "round",
  "abs",
  "lower",
  "upper",
  "length",
  "trim",
]);

const TABLE_REF = /\b(?:from|join)\s+([a-z_][a-z0-9_]*)(?:\s+(?:as\s+)?([a-z_][a-z0-9_]*))?/g;
const DOTTED = /\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)/g;
const WORD = /[a-z_][a-z0-9_]*/g;

export function validateSql(sql: string, schema: Schema): Verdict {
  const norm = normalizeSql(sql);

  // 1. SELECT-only guard — a leading DDL/DML keyword blocks the statement.
  const lead = norm.split(" ")[0];
  if (DML_DDL.has(lead)) {
    return { ok: false, violations: [{ kind: "dml", keyword: lead.toUpperCase() }] };
  }

  const violations: Violation[] = [];

  // 2. Table references (FROM / JOIN) with optional aliases.
  const tables: string[] = [];
  const aliases = new Map<string, string>();
  let m: RegExpExecArray | null;
  const tableRe = new RegExp(TABLE_REF.source, "g");
  while ((m = tableRe.exec(norm))) {
    const table = m[1];
    const alias = m[2] ?? null;
    tables.push(table);
    if (alias) aliases.set(alias, table);
  }

  const existingTables = tables.filter((t) => hasTable(schema, t));
  for (const t of tables) {
    if (!hasTable(schema, t)) violations.push({ kind: "table", table: t });
  }

  // 3. Dotted column references (alias.column / table.column).
  const dottedRe = new RegExp(DOTTED.source, "g");
  while ((m = dottedRe.exec(norm))) {
    const prefix = m[1];
    const column = m[2];
    const resolved = aliases.get(prefix) ?? (hasTable(schema, prefix) ? prefix : null);
    if (resolved && hasTable(schema, resolved) && !hasColumn(schema, resolved, column)) {
      violations.push({ kind: "column", table: resolved, column });
    }
  }

  // 4. Bare column references. Only validated against tables that actually
  //    exist; if a table is unknown the table violation above already covers it.
  if (existingTables.length > 0) {
    const validColumns = new Set<string>();
    for (const t of existingTables) {
      for (const c of columnNames(schema, t)) validColumns.add(c);
    }

    let bare = norm.replace(/'[^']*'/g, " ");
    bare = bare.replace(new RegExp(DOTTED.source, "g"), " ");
    const definedAliases = new Set<string>();
    bare = bare.replace(/\bas\s+([a-z_][a-z0-9_]*)/g, (_s, a: string) => {
      definedAliases.add(a);
      return " ";
    });

    const stop = new Set([
      ...KEYWORDS,
      ...tables,
      ...aliases.keys(),
      ...definedAliases,
      ...tableNames(schema),
    ]);

    const attrTable = existingTables[0];
    const tokens = bare.match(new RegExp(WORD.source, "g")) ?? [];
    for (const tok of tokens) {
      if (stop.has(tok)) continue;
      if (!validColumns.has(tok)) {
        violations.push({ kind: "column", table: attrTable, column: tok });
      }
    }
  }

  return { ok: violations.length === 0, violations };
}

export function violationLabel(v: Violation): string {
  switch (v.kind) {
    case "table":
      return `table:${v.table}`;
    case "column":
      return `column:${v.table}.${v.column}`;
    case "dml":
      return `dml:${v.keyword}`;
  }
}
