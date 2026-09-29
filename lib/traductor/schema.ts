// lib/traductor/schema.ts
// Schema loading and lookup helpers. The schema is the single source of truth
// that the hallucination detector checks every reference against.

import type { Schema } from "./types";

export function tableNames(schema: Schema): string[] {
  return Object.keys(schema.tables);
}

export function columnNames(schema: Schema, table: string): string[] {
  const t = schema.tables[table];
  return t ? Object.keys(t.columns) : [];
}

export function hasTable(schema: Schema, table: string): boolean {
  return table in schema.tables;
}

export function hasColumn(schema: Schema, table: string, column: string): boolean {
  const t = schema.tables[table];
  return !!t && column in t.columns;
}
