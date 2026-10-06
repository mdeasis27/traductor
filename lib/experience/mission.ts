import schemaRaw from "@/lib/traductor/data/schema.json";
import questionsRaw from "@/lib/traductor/data/questions.json";
import { exactMatch } from "@/lib/traductor/normalize";
import { shelfOutcomes, type ShelfStatus } from "@/lib/traductor/shelves";
import type { Question, Schema } from "@/lib/traductor/types";
import type { DemoAdapter, TraceEvent } from "@/design-system/demo/types";

export type AskedQuestion = { id: string; status: ShelfStatus };
export type MissionInput = { tables: number };
export type MissionResult = { items: AskedQuestion[]; served: number; comparison: { mine: number; raw: number } };

const STEP = 5;
const schema = schemaRaw as unknown as Schema;
const questions = questionsRaw.questions as Question[];

/** Every committed question through the real generator and guard, knowing only the first k tables. */
export function askQuestions(tables: number): AskedQuestion[] {
  return shelfOutcomes(questions, schema, tables).map((status, i) => ({ id: questions[i].id, status }));
}

/** Without the guard the raw model draft runs as written; these questions come back with a wrong result. */
export function rawDraftWrong(): string[] {
  return questions.filter(q => !exactMatch(q.naiveSql, q.sql)).map(q => q.id);
}

export const runMission: DemoAdapter<MissionInput, MissionResult> = async (input, signal, onEvent) => {
  const startedAt = performance.now();
  const items = askQuestions(input.tables);
  const trace: TraceEvent[] = [];
  for (let i = 0; i < items.length; i += STEP) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const event: TraceEvent = { id: `batch-${i / STEP + 1}`, step: i / STEP + 1, kind: "lookup", messageKey: `batch.${i / STEP + 1}`, timestampMs: performance.now() - startedAt, evidenceIds: items.slice(i, i + STEP).map(q => q.id) };
    trace.push(event);
    onEvent(event);
  }
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const served = items.filter(i => i.status === "served").length;
  const mine = items.filter(i => i.status === "lost").length;
  return { input, result: { items, served, comparison: { mine, raw: rawDraftWrong().length } }, trace, executionMs: performance.now() - startedAt, mode: "local" };
};
