// lib/traductor/normalize.ts
// SQL normalization for exact-match: lowercase, collapse whitespace, strip a
// trailing semicolon. Keeps the benchmark's exact-match honest across cosmetic
// formatting differences without hiding real semantic changes.

export function normalizeSql(sql: string): string {
  return sql
    .replace(/;\s*$/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function exactMatch(a: string, b: string): boolean {
  return normalizeSql(a) === normalizeSql(b);
}
