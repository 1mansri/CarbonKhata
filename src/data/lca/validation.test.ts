import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VALIDATION_CASES } from "@/data/lca/validation";
import { calculateProject } from "@/lib/lca/calculate";
import { createProject } from "@/lib/lca/project";
import chaudhary from "@/data/lca/validation/chaudhary-2022.json";

describe("validation against published studies", () => {
  for (const c of VALIDATION_CASES) {
    for (const check of c.checks) {
      it(`${c.citation}: ${check.label}`, () => {
        const result = calculateProject(createProject(c.build()));
        const got = result.modules[check.module];
        assert.ok(
          Math.abs(got - check.published) <= check.toleranceKg,
          `${check.label}: tool ${got.toFixed(2)} vs published ${check.published}`,
        );
      });
    }
  }

  it("Chaudhary & Akhtar: every line matches its Table S4 value after unit conversion", () => {
    const c = VALIDATION_CASES.find((v) => v.id === "chaudhary-2022")!;
    const result = calculateProject(createProject(c.build()));
    chaudhary.materials.forEach((row, i) => {
      const line = result.items[i].modules["A1-A3"];
      assert.ok(Math.abs(line - row.gwpTableS4) < 1e-6, `row ${row.row} ${row.material}: ${line} vs ${row.gwpTableS4}`);
    });
  });
});
