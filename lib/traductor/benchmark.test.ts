import { describe, expect, it } from "vitest";

import schemaRaw from "./data/schema.json";
import questionsRaw from "./data/questions.json";
import benchmarkFixture from "./fixtures/benchmark.json";
import validationFixture from "./fixtures/validation.json";
import { benchmark } from "./benchmark";
import { validateSql, violationLabel } from "./validate";
import type { Question, Schema } from "./types";

const SCHEMA = schemaRaw as unknown as Schema;
const QUESTIONS = questionsRaw.questions as Question[];

describe("pinned fixture: benchmark", () => {
  it("reproduces guarded vs naive validity and hallucination recall", () => {
    const result = benchmark(QUESTIONS, SCHEMA);

    expect(result.n).toBe(benchmarkFixture.n);
    expect(result.guarded.valid).toBe(benchmarkFixture.guarded.valid);
    expect(result.naive.valid).toBe(benchmarkFixture.naive.valid);
    expect(result.guarded.rate).toBeCloseTo(benchmarkFixture.guarded.rate, 10);
    expect(result.naive.rate).toBeCloseTo(benchmarkFixture.naive.rate, 10);
    expect(result.hallucinationsCaught).toBe(benchmarkFixture.hallucinationsCaught);
    expect(result.hallucinationsTotal).toBe(benchmarkFixture.hallucinationsTotal);
    expect(result.falsePositives).toBe(benchmarkFixture.falsePositives);
  });
});

describe("pinned fixture: hallucination detector", () => {
  for (const c of validationFixture.cases as { id: string; sql: string; expected: string[] }[]) {
    it(`${c.id} produces the pinned verdict`, () => {
      const verdict = validateSql(c.sql, SCHEMA);
      const labels = verdict.violations.map(violationLabel);
      expect(labels).toEqual(c.expected);
      expect(verdict.ok).toBe(c.expected.length === 0);
    });
  }
});
