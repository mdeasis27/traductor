import { describe, expect, it } from "vitest";
import schemaRaw from "./data/schema.json";
import questionsRaw from "./data/questions.json";
import coverage from "./fixtures/coverage.json";
import { questionTables, shelfOutcomes, SHELF_ORDER } from "./shelves";
import type { Question, Schema } from "./types";

const schema = schemaRaw as unknown as Schema;
const questions = questionsRaw.questions as Question[];
const count = (k: number) => {
  const s = shelfOutcomes(questions, schema, k);
  return { served: s.filter(x => x === "served").length, rerouted: s.filter(x => x === "rerouted").length, lost: s.filter(x => x === "lost").length };
};

describe("shelfOutcomes", () => {
  it("reads the tables in a fixed order", () => {
    expect(SHELF_ORDER).toEqual(["customers", "orders", "payments"]);
  });

  it("knowing 2 of 3 tables answers 8 of 10; all 3 answers every question", () => {
    expect(count(2)).toEqual({ served: 8, rerouted: 2, lost: 0 });
    expect(count(3)).toEqual({ served: 10, rerouted: 0, lost: 0 });
    expect(count(0)).toEqual({ served: 0, rerouted: 10, lost: 0 });
  });

  it("matches the per-question outcomes pinned for Python", () => {
    for (let k = 0; k <= 3; k++) expect(shelfOutcomes(questions, schema, k)).toEqual(coverage.outcomes[String(k) as "0" | "1" | "2" | "3"]);
  });

  it("lists the shelves each question reads, in the order its query visits them", () => {
    expect(Object.fromEntries(questions.map(q => [q.id, questionTables(q.sql)]))).toEqual(coverage.tables);
    expect(questionTables("SELECT o.id FROM orders o JOIN customers c ON o.customer_id = c.id")).toEqual(["orders", "customers"]);
  });
});
