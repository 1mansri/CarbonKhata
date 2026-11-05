import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { buildWorkbook, sourcesUsed, toBibtex } from "@/lib/lca/export";
import { calculateProject } from "@/lib/lca/calculate";
import { getMaterial } from "@/data/lca/materials";
import { TRANSPORT_FACTORS } from "@/data/lca/transport";
import { SITE_FACTORS } from "@/data/lca/site";
import { EOL_FACTORS } from "@/data/lca/end-of-life";
import { createProject } from "@/lib/lca/project";

const truckVkm = TRANSPORT_FACTORS.find((f) => f.id === "in-truck-hdv")!;
const hgvTkm = TRANSPORT_FACTORS.find((f) => f.id === "uk-hgv-avg")!;

const project = createProject({
  name: "Formula check",
  scope: {
    goal: "",
    functionalUnit: "1 building",
    boundary: { a4: true, a5: true, c: true, d: true },
  },
  items: [
    {
      id: "a",
      material: getMaterial("epd-acc-rmc-m30")!,
      quantity: 120,
      unit: "m3",
      transport: { distanceKm: 18, factor: truckVkm, payloadT: 14 },
      wastagePct: 3,
      endOfLife: { kind: "epd" },
    },
    {
      id: "b",
      material: getMaterial("epd-sail-bsp-tmt")!,
      quantity: 9.5,
      unit: "t",
      transport: { distanceKm: 640, factor: hgvTkm },
      wastagePct: 5,
      endOfLife: { kind: "route", factor: EOL_FACTORS.find((f) => f.id === "eol-metals-recycling")! },
    },
    { id: "c", material: getMaterial("ifc2017-sand")!, quantity: 80_000, unit: "kg" },
  ],
  siteEnergy: [{ id: "e", quantity: 4200, factor: SITE_FACTORS[0] }],
});

/** Evaluates the small formula language the export writes: refs, + - * /, IF(), SUM(range). */
function evaluate(wb: XLSX.WorkBook, sheetName: string, formula: string): number {
  const valueOf = (sheet: string, ref: string) => {
    const cell = wb.Sheets[sheet][ref];
    return typeof cell?.v === "number" ? cell.v : 0;
  };
  let expr = formula.replace(/SUM\((?:'?([^'!]+)'?!)?([A-Z]+)(\d+):([A-Z]+)(\d+)\)/g, (_, sh, c1, r1, c2, r2) => {
    let total = 0;
    for (let r = Number(r1); r <= Number(r2); r++) {
      for (let c = XLSX.utils.decode_col(c1); c <= XLSX.utils.decode_col(c2); c++) {
        total += valueOf(sh ?? sheetName, `${XLSX.utils.encode_col(c)}${r}`);
      }
    }
    return String(total);
  });
  expr = expr.replace(/IF\(([^,]+),([^,]+),([^)]+)\)/g, "(($1)?($2):($3))");
  expr = expr.replace(/\b([A-Z]{1,2})(\d+)\b/g, (_, c, r) => String(valueOf(sheetName, `${c}${r}`)));
  return Function(`"use strict"; return (${expr});`)() as number;
}

describe("Excel export", () => {
  it("every formula recomputes to the engine's value", () => {
    const wb = buildWorkbook(project);
    let checked = 0;
    for (const name of wb.SheetNames) {
      for (const [ref, cell] of Object.entries(wb.Sheets[name])) {
        if (ref.startsWith("!") || !(cell as XLSX.CellObject).f) continue;
        const c = cell as XLSX.CellObject;
        const got = evaluate(wb, name, c.f!);
        assert.ok(Math.abs(got - (c.v as number)) < 1e-6, `${name}!${ref} = ${c.f} → ${got}, expected ${c.v}`);
        checked++;
      }
    }
    assert.ok(checked > 20, `only ${checked} formulas checked`);
  });

  it("summary total equals the engine total", () => {
    const wb = buildWorkbook(project);
    const total = wb.Sheets.Summary.B12 as XLSX.CellObject;
    assert.equal(total.f, "SUM(B8:B11)");
    assert.ok(Math.abs((total.v as number) - calculateProject(project).total) < 1e-6);
  });

  it("BibTeX lists each source once with its URL", () => {
    const bib = toBibtex(sourcesUsed(project));
    assert.equal((bib.match(/^@/gm) ?? []).length, sourcesUsed(project).length);
    assert.match(bib, /number = \{EPD-IES-/);
    assert.match(bib, /url = \{https:\/\//);
  });
});
