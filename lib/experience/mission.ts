import schemaRaw from "@/lib/traductor/data/schema.json";
import questionsRaw from "@/lib/traductor/data/questions.json";
import { exactMatch } from "@/lib/traductor/normalize";
import { questionTables, shelfOutcomes, type ShelfStatus } from "@/lib/traductor/shelves";
import type { Question, Schema } from "@/lib/traductor/types";
import type { DemoAdapter, TraceEvent } from "@/design-system/demo/types";

/** tables: the shelves the question needs, in the order its query reads them. */
export type AskedQuestion = { id: string; status: ShelfStatus; tables: string[] };
export type MissionInput = { tables: number };
export type MissionResult = { items: AskedQuestion[]; served: number; comparison: { mine: number; raw: number } };

const schema = schemaRaw as unknown as Schema;
const questions = questionsRaw.questions as Question[];

/** Every committed question through the real generator and guard, knowing only the first k tables. */
export function askQuestions(tables: number): AskedQuestion[] {
  return shelfOutcomes(questions, schema, tables).map((status, i) => ({ id: questions[i].id, status, tables: questionTables(questions[i].sql) }));
}

/** Without the guard the raw model draft runs as written; these questions come back with a wrong result. */
export function rawDraftWrong(): string[] {
  return questions.filter(q => !exactMatch(q.naiveSql, q.sql)).map(q => q.id);
}

export const runMission: DemoAdapter<MissionInput, MissionResult> = async (input, signal, onEvent) => {
  const startedAt = performance.now();
  const items = askQuestions(input.tables);
  const trace: TraceEvent[] = [];
  // One step per question so the scene can walk the librarian through each trip.
  items.forEach((q, i) => {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const event: TraceEvent = { id: `ask-${i + 1}`, step: i + 1, kind: "lookup", messageKey: `ask.${q.status}`, timestampMs: performance.now() - startedAt, evidenceIds: [q.id, ...q.tables] };
    trace.push(event);
    onEvent(event);
  });
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const served = items.filter(i => i.status === "served").length;
  const mine = items.filter(i => i.status === "lost").length;
  return { input, result: { items, served, comparison: { mine, raw: rawDraftWrong().length } }, trace, executionMs: performance.now() - startedAt, mode: "local" };
};
