import { describe, expect, it } from "vitest";
import { runExperience } from "./adapter";

describe("translator experience", () => {
  it("returns local rows for a supported question and refuses unsupported text", async () => {
    const supported = await runExperience({ question: "list customers" });
    const unsupported = await runExperience({ question: "delete all invoices" });
    expect(supported.result.status).toBe("computed");
    expect(supported.result.rows.length).toBeGreaterThan(0);
    expect(unsupported.result.status).toBe("refused");
  });
});
