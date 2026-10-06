import { expect, it } from "vitest";
import { askQuestions, rawDraftWrong, runMission } from "./mission";

const count = (k: number) => {
  const items = askQuestions(k);
  return { served: items.filter(i => i.status === "served").length, rerouted: items.filter(i => i.status === "rerouted").length, lost: items.filter(i => i.status === "lost").length };
};

it("knowing 2 tables the librarian answers 8 of 10 and refuses the two payment questions", () => {
  expect(count(2)).toEqual({ served: 8, rerouted: 2, lost: 0 });
  expect(askQuestions(2).filter(i => i.status === "rerouted").map(i => i.id)).toEqual(["q08", "q10"]);
});

it("sweep: both bet answers are reachable on the slider, and the default says no", () => {
  const answers = new Set<boolean>();
  for (let k = 0; k <= 3; k++) answers.add(count(k).served >= 9);
  expect([...answers].sort()).toEqual([false, true]);
  expect(count(2).served >= 9).toBe(false);
  expect(count(3).served).toBe(10);
});

it("the raw model draft, run without the guard, gets 3 answers wrong", () => {
  expect(rawDraftWrong()).toEqual(["q05", "q07", "q09"]);
});

it("runs the mission, reveals in two groups of five and stops when cancelled", async () => {
  const ids: string[] = [];
  const run = await runMission({ tables: 2 }, new AbortController().signal, e => ids.push(e.id));
  expect(run.result.items).toHaveLength(10);
  expect(run.result.served).toBe(8);
  expect(run.result.comparison).toEqual({ mine: 0, raw: 3 });
  expect(ids).toEqual(["batch-1", "batch-2"]);
  const c = new AbortController(); c.abort();
  await expect(runMission({ tables: 2 }, c.signal, () => {})).rejects.toThrow();
});
