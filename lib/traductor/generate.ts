// lib/traductor/generate.ts
// The guarded generator: a deterministic template router standing in for the
// LLM. Instead of emitting raw SQL, it fills a pre-validated parametrized
// template — the model's job is reduced to choosing a template and supplying
// values, so a hallucinated table/column is structurally impossible from this
// path. Mirrors backend/src/traductor/generate.py.

import { hasColumn, hasTable } from "./schema";
import type { Question, Schema } from "./types";

function formatValue(value: string | number): string {
  return typeof value === "number" ? String(value) : `'${value}'`;
}

function requireTable(schema: Schema, table: string): void {
  if (!hasTable(schema, table)) throw new Error(`unknown table: ${table}`);
}

function requireColumn(schema: Schema, table: string, column: string): void {
  requireTable(schema, table);
  if (!hasColumn(schema, table, column)) {
    throw new Error(`unknown column: ${table}.${column}`);
  }
}

export function generate(question: Question, schema: Schema): string {
  const p = question.params;
  const table = typeof p.table === "string" ? p.table : "";
  const column = typeof p.column === "string" ? p.column : "";
  const aggregate = typeof p.aggregate === "string" ? p.aggregate : "";

  switch (question.template) {
    case "list_all":
      requireTable(schema, table);
      return `SELECT * FROM ${table}`;

    case "count_all":
      requireTable(schema, table);
      return `SELECT COUNT(*) FROM ${table}`;

    case "filter_eq":
      requireColumn(schema, table, column);
      return `SELECT * FROM ${table} WHERE ${column} = ${formatValue(p.value as string | number)}`;

    case "filter_gt":
      requireColumn(schema, table, column);
      return `SELECT * FROM ${table} WHERE ${column} > ${formatValue(p.value as string | number)}`;

    case "aggregate_sum":
      requireColumn(schema, table, column);
      return `SELECT SUM(${column}) FROM ${table}`;

    case "group_count":
      requireColumn(schema, table, column);
      return `SELECT ${column}, COUNT(*) FROM ${table} GROUP BY ${column}`;

    case "top_join_count":
      requireTable(schema, "customers");
      requireTable(schema, "orders");
      requireColumn(schema, "orders", "customer_id");
      return `SELECT c.name, COUNT(o.id) AS n FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.name ORDER BY n DESC LIMIT ${formatValue(p.limit as number)}`;

    case "group_sum":
      requireColumn(schema, table, column);
      requireColumn(schema, table, aggregate);
      return `SELECT ${column}, SUM(${aggregate}) FROM ${table} GROUP BY ${column}`;

    case "filter_join":
      requireTable(schema, "customers");
      requireTable(schema, "orders");
      return `SELECT o.id FROM orders o JOIN customers c ON o.customer_id = c.id WHERE c.tier = 'premium' AND o.status = 'pending'`;

    case "aggregate_avg":
      requireColumn(schema, table, column);
      return `SELECT AVG(${column}) FROM ${table}`;

    default:
      throw new Error(`unknown template: ${question.template}`);
  }
}
