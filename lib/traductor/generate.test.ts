import { describe, expect, it } from "vitest";

import schemaRaw from "./data/schema.json";
import questionsRaw from "./data/questions.json";
import { generate } from "./generate";
import { exactMatch } from "./normalize";
import { validateSql } from "./validate";
import type { Question, Schema } from "./types";

const SCHEMA = schemaRaw as unknown as Schema;
const QUESTIONS = questionsRaw.questions as Question[];

describe("generate — parametrized templates reproduce gold SQL", () => {
  for (const q of QUESTIONS) {
    it(`${q.id}: ${q.text}`, () => {
      const generated = generate(q, SCHEMA);
      expect(exactMatch(generated, q.sql)).toBe(true);
    });
  }
});

describe("generate — output always passes the guardrail", () => {
  for (const q of QUESTIONS) {
    it(`${q.id} validates clean`, () => {
      const verdict = validateSql(generate(q, SCHEMA), SCHEMA);
      expect(verdict.ok).toBe(true);
    });
  }
});

describe("generate — rejects unknown schema references at generation", () => {
  it("throws on an unknown table", () => {
    const q: Question = {
      id: "x",
      text: "",
      template: "list_all",
      params: { table: "users" },
      sql: "",
      naiveSql: "",
    };
    expect(() => generate(q, SCHEMA)).toThrow("unknown table: users");
  });

  it("throws on an unknown column", () => {
    const q: Question = {
      id: "x",
      text: "",
      template: "filter_eq",
      params: { table: "customers", column: "email", value: "x" },
      sql: "",
      naiveSql: "",
    };
    expect(() => generate(q, SCHEMA)).toThrow("unknown column: customers.email");
  });
});
