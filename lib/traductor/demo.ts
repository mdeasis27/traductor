// lib/traductor/demo.ts
// Wires committed schema + questions + validation cases into every number the
// dashboard displays. Runs fully offline (no API keys, no DB) — the schema is
// the only source of truth and validation is deterministic.

import schemaRaw from "./data/schema.json";
import questionsRaw from "./data/questions.json";
import validationRaw from "./fixtures/validation.json";

import { benchmark } from "./benchmark";
import { generate } from "./generate";
import { validateSql, violationLabel } from "./validate";
import type { Question, Schema } from "./types";

const SCHEMA = schemaRaw as unknown as Schema;
const QUESTIONS = questionsRaw.questions as Question[];
const CASES = validationRaw.cases as { id: string; sql: string; expected: string[] }[];

let memoBenchmark: ReturnType<typeof benchmark> | null = null;

export function getSchema(): Schema {
  return SCHEMA;
}

export function getBenchmark() {
  if (!memoBenchmark) {
    memoBenchmark = benchmark(QUESTIONS, SCHEMA);
  }
  return memoBenchmark;
}

export function getSchemaStats() {
  const tables = Object.keys(SCHEMA.tables);
  const columns = tables.reduce((acc, t) => acc + Object.keys(SCHEMA.tables[t].columns).length, 0);
  return { tables: tables.length, columns, questions: QUESTIONS.length };
}

export function getQuestions() {
  return QUESTIONS.map((q) => {
    const generated = generate(q, SCHEMA);
    const verdict = validateSql(generated, SCHEMA);
    const naiveVerdict = validateSql(q.naiveSql, SCHEMA);
    return {
      id: q.id,
      text: q.text,
      generated,
      generatedOk: verdict.ok,
      naiveSql: q.naiveSql,
      naiveOk: naiveVerdict.ok,
      naiveViolations: naiveVerdict.violations.map(violationLabel),
    };
  });
}

export function getValidationCases() {
  return CASES.map((c) => {
    const verdict = validateSql(c.sql, SCHEMA);
    const labels = verdict.violations.map(violationLabel);
    return {
      id: c.id,
      sql: c.sql,
      ok: verdict.ok,
      violations: labels,
      caught: JSON.stringify(labels) === JSON.stringify(c.expected),
    };
  });
}

export function getCaughtExample() {
  const q = QUESTIONS.find((x) => x.id === "q05")!;
  const verdict = validateSql(q.naiveSql, SCHEMA);
  return {
    question: q.text,
    sql: q.naiveSql,
    violations: verdict.violations.map(violationLabel),
  };
}
