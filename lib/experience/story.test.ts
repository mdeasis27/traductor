import { describe, expect, it } from "vitest";
import { STORY } from "./story";
import questionsRaw from "@/lib/traductor/data/questions.json";
import { lintStory, storyStrings as strings } from "@/design-system/demo/copy-lint";

describe("Traductor story copy", () => {
  it("has the same shape in English and Spanish", () => {
    const keys = (o: unknown): string[] => o && typeof o === "object" && !Array.isArray(o) ? Object.entries(o).filter(([k]) => k !== "before" && k !== "after").flatMap(([k, v]) => [k, ...keys(v).map(x => `${k}.${x}`)]) : [];
    expect(keys(STORY.es)).toEqual(keys(STORY.en));
    expect(STORY.es.analogy.dictionary).toHaveLength(STORY.en.analogy.dictionary.length);
    expect(STORY.es.tryIt.shelves).toHaveLength(3);
  });

  it("has no empty strings except the owner-supplied why note", () => {
    for (const locale of ["en", "es"] as const) {
      const { why, ...rest } = STORY[locale];
      expect(why.title.trim()).not.toBe("");
      for (const s of strings(rest)) expect(s.trim(), `${locale}: empty string`).not.toBe("");
    }
  });

  it("avoids AI-sounding patterns and brand names", () => {
    for (const locale of ["en", "es"] as const) expect(lintStory(STORY[locale]), locale).toEqual([]);
  });

  it("states the comparison truthfully at zero, one, a tie and the reverse case", () => {
    expect(STORY.en.compare.sentence(0, 3)).toContain("no wrong answers");
    expect(STORY.es.compare.sentence(1, 3)).toContain("1 respuesta equivocada");
    expect(STORY.es.compare.sentence(3, 3)).toBe("Los dos lados dieron 3 respuestas equivocadas.");
    expect(STORY.en.compare.sentence(1, 1)).toBe("Both sides gave 1 wrong answer.");
    expect(STORY.en.compare.sentence(4, 3)).toContain("raw draft did better");
  });

  it("asks the bet about the tables the visitor chose", () => {
    expect(STORY.en.tryIt.question(2)).toContain("knowing 2 of the 3 tables");
    expect(STORY.es.tryIt.question(1)).toContain("conociendo 1 de las 3 tablas,");
    expect(STORY.es.compare.verdict(8)).toBe("8 de 10 preguntas respondidas");
  });

  it("has a scene line for every committed question, in both languages", () => {
    const ids = questionsRaw.questions.map(q => q.id);
    expect(Object.keys(STORY.en.scene.questions)).toEqual(ids);
    expect(Object.keys(STORY.es.scene.questions)).toEqual(ids);
    expect(STORY.es.scene.questions.q08).toBe(questionsRaw.questions[7].text);
    expect(STORY.en.scene.summary(8, 1)).toBe("Done: 8 with the right book and 1 honest refusal.");
    expect(STORY.es.scene.wrongOf(0)).toBe("Ningún libro equivocado.");
  });
});
