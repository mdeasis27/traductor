// lib/traductor/benchmark.ts
// Guarded generator vs naive raw-model baseline, plus the guardrail's
// hallucination recall / false-positive rate. Mirrors backend/src/traductor/benchmark.py.
//
// The "naive" baseline is a raw LLM's committed output (question.naiveSql):
// it gets most queries right but hallucinates a column, a table, and a DML
// statement. The guardrail is the safety net that runs before execution.

import { generate } from "./generate";
import { exactMatch } from "./normalize";
import { validateSql } from "./validate";
import type { BenchmarkResult, Question, Schema } from "./types";

function rate(valid: number, total: number): number {
  return total === 0 ? 0 : valid / total;
}

export function benchmark(questions: readonly Question[], schema: Schema): BenchmarkResult {
  let guardedValid = 0;
  let naiveValid = 0;
  let hallucinationsCaught = 0;
  let hallucinationsTotal = 0;
  let falsePositives = 0;

  for (const q of questions) {
    const generated = generate(q, schema);
    const guardedVerdict = validateSql(generated, schema);
    if (guardedVerdict.ok && exactMatch(generated, q.sql)) guardedValid++;

    const naiveExact = exactMatch(q.naiveSql, q.sql);
    const naiveVerdict = validateSql(q.naiveSql, schema);
    if (naiveExact && naiveVerdict.ok) naiveValid++;

    if (!naiveExact) {
      hallucinationsTotal++;
      if (!naiveVerdict.ok) hallucinationsCaught++;
    } else if (!naiveVerdict.ok) {
      falsePositives++;
    }
  }

  const n = questions.length;
  return {
    guarded: { valid: guardedValid, total: n, rate: rate(guardedValid, n) },
    naive: { valid: naiveValid, total: n, rate: rate(naiveValid, n) },
    hallucinationsCaught,
    hallucinationsTotal,
    falsePositives,
    n,
  };
}
