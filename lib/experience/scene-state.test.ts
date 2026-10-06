import { expect, it } from "vitest";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { activeQuestion, questionCells, revealedQuestions, tripStops } from "./scene-state";
import { runMission } from "./mission";

it("hides the questions not revealed yet", () => {
  expect(questionCells([{ id: "a", status: "served", tables: [] }, { id: "b", status: "rerouted", tables: [] }], 1)).toEqual(["served", "pending"]);
});

it("final tape counts equal the mission totals", async () => {
  const { result } = await runMission({ tables: 2 }, new AbortController().signal, () => {});
  expect(tapeCounts(questionCells(result.items, result.items.length))).toEqual({ served: result.served, rerouted: 2, lost: 0, pending: 0 });
});

it("reveals half per frame, all of it when complete or under reduced motion", () => {
  expect(revealedQuestions({ visible: 1, total: 2, complete: false }, 10, false)).toBe(5);
  expect(revealedQuestions({ visible: 2, total: 2, complete: true }, 10, false)).toBe(10);
  expect(revealedQuestions({ visible: 1, total: 2, complete: false }, 10, true)).toBe(10);
});

it("reveals one question per step when the trace has one step per question", () => {
  expect(revealedQuestions({ visible: 3, total: 10, complete: false }, 10, false)).toBe(3);
});

it("walks to each shelf the question needs and marks the ones the librarian never catalogued", () => {
  expect(tripStops(["customers", "orders"], 2)).toEqual([{ shelf: 0, known: true }, { shelf: 1, known: true }]);
  expect(tripStops(["customers", "orders"], 1)).toEqual([{ shelf: 0, known: true }, { shelf: 1, known: false }]);
  expect(tripStops(["payments"], 2)).toEqual([{ shelf: 2, known: false }]);
  expect(tripStops(["payments"], 3)).toEqual([{ shelf: 2, known: true }]);
});

it("animates the current question only while playing with motion allowed", () => {
  expect(activeQuestion({ visible: 3, total: 10, complete: false }, false)).toBe(2);
  expect(activeQuestion({ visible: 10, total: 10, complete: true }, false)).toBe(9);
  expect(activeQuestion({ visible: 3, total: 10, complete: false }, true)).toBeNull();
  expect(activeQuestion({ visible: 0, total: 0, complete: true }, false)).toBeNull();
});
