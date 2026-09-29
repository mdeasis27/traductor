// lib/traductor/types.ts
// Core data shapes for the Text-to-SQL demo. All fields are plain
// JSON-serializable so the same types are mirrored one-to-one in the Python
// backend (backend/src/traductor/types.py).

export interface Schema {
  tables: Record<string, Table>;
}

export interface Table {
  columns: Record<string, string>;
}

export interface Question {
  id: string;
  text: string;
  template: string;
  params: Record<string, string | number>;
  sql: string;
  naiveSql: string;
}

export interface HallucinationCase {
  id: string;
  sql: string;
  expected: string[];
}

export type Violation =
  | { kind: "table"; table: string }
  | { kind: "column"; table: string; column: string }
  | { kind: "dml"; keyword: string };

export interface Verdict {
  ok: boolean;
  violations: Violation[];
}

export interface PathStat {
  valid: number;
  total: number;
  rate: number;
}

export interface BenchmarkResult {
  guarded: PathStat;
  naive: PathStat;
  hallucinationsCaught: number;
  hallucinationsTotal: number;
  falsePositives: number;
  n: number;
}
