import * as XLSX from "xlsx";
import { getSource, type Source } from "@/data/lca/sources";
import { calculateProject } from "@/lib/lca/calculate";
import { MODULE_META, QUALITY_META } from "@/lib/lca/quality";
import { toDeclaredUnit, toKg, unitLabel } from "@/lib/lca/units";
import type { Project } from "@/lib/lca/types";

/** Every source the project's numbers depend on, in first-use order. */
export function sourcesUsed(project: Project): Source[] {
  const ids = new Set<string>();
  for (const item of project.items) {
    ids.add(item.material.source.sourceId);
    if (item.transport) ids.add(item.transport.factor.source.sourceId);
    if (item.endOfLife?.kind === "route") ids.add(item.endOfLife.factor.source.sourceId);
  }
  for (const e of project.siteEnergy) ids.add(e.factor.source.sourceId);
  return [...ids].map(getSource).filter((s): s is Source => !!s);
}

export function toBibtex(sources: Source[]): string {
  return sources
    .filter((s) => s.id !== "user")
    .map((s) => {
      const fields = { ...s.bibtex.fields, url: s.url, urldate: s.accessed, note: s.license };
      const body = Object.entries(fields)
        .filter(([, v]) => v)
        .map(([k, v]) => `  ${k} = {${v}}`)
        .join(",\n");
      return `@${s.bibtex.type}{${s.id.replace(/[^a-z0-9]/gi, "")},\n${body}\n}`;
    })
    .join("\n\n");
}

export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}

type Cell = XLSX.CellObject;
const n = (v: number, f?: string): Cell => ({ t: "n", v, f });
const s = (v: string): Cell => ({ t: "s", v });

function sheet(rows: (Cell | null)[][], widths: number[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  rows.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell) ws[XLSX.utils.encode_cell({ r, c })] = cell;
    }),
  );
  const cols = Math.max(...rows.map((r) => r.length));
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: cols - 1 } });
  ws["!cols"] = widths.map((wch) => ({ wch }));
  return ws;
}

/**
 * Workbook with live formulas so every number can be audited in Excel:
 * A1–A3 = quantity × factor, A4 = mass × distance × factor, and so on.
 * Cached values are written too, so viewers that don't recalculate still
 * show the right numbers.
 */
export function buildWorkbook(project: Project): XLSX.WorkBook {
  const result = calculateProject(project);
  const { boundary } = project.scope;
  const wb = XLSX.utils.book_new();

  // Inventory: one row per line, formulas reference the row's own cells.
  const head = [
    "#", "Material", "Quantity", "Unit", "Qty (declared unit)", "Declared unit", "A1–A3 factor (kg CO2e/unit)",
    "A1–A3 (kg CO2e)", "Mass (t)", "Distance (km)", "Transport factor", "Transport basis", "Payload (t/trip)",
    "A4 (kg CO2e)", "Wastage (%)", "A5 wastage (kg CO2e)", "End-of-life factor", "C1–C4 (kg CO2e)",
    "D (kg CO2e)", "Line total (kg CO2e)", "Source", "Table / page", "Data quality",
  ].map(s);
  const rows: (Cell | null)[][] = [head];

  project.items.forEach((item, i) => {
    const r = i + 2; // 1-based Excel row
    const res = result.items[i];
    const qd = toDeclaredUnit(item.quantity, item.unit, item.material) ?? 0;
    const massT = (toKg(item.quantity, item.unit, item.material) ?? 0) / 1000;
    const t = boundary.a4 ? item.transport : undefined;
    const a4f = !t || !t.distanceKm ? "0" : t.factor.basis === "tkm" ? `I${r}*J${r}*K${r}` : `IF(M${r}>0,I${r}/M${r}*J${r}*K${r},0)`;
    const eol = boundary.c ? item.endOfLife : undefined;
    const eolFactor = !eol ? 0 : eol.kind === "epd" ? (item.material.epdEndOfLife?.c1c4 ?? 0) : eol.factor.value;
    const eolF = !eol ? "0" : eol.kind === "epd" ? `E${r}*Q${r}` : `I${r}*Q${r}`;
    const d = boundary.d ? (item.material.epdEndOfLife?.d ?? 0) : 0;

    rows.push([
      n(i + 1),
      s(res.label),
      n(item.quantity),
      s(unitLabel(item.unit)),
      n(qd),
      s(unitLabel(item.material.declaredUnit)),
      n(item.material.gwp),
      n(res.modules["A1-A3"], `E${r}*G${r}`),
      n(massT),
      n(t?.distanceKm ?? 0),
      n(t?.factor.value ?? 0),
      s(t ? (t.factor.basis === "tkm" ? "per t·km" : "per vehicle-km") : ""),
      n(t?.payloadT ?? 0),
      n(res.modules.A4, a4f),
      n(boundary.a5 ? (item.wastagePct ?? 0) : 0),
      n(res.modules.A5, `O${r}/100*(H${r}+N${r})`),
      n(eolFactor),
      n(res.modules["C1-C4"], eolF),
      n(res.modules.D, d ? `E${r}*${d}` : "0"),
      n(res.total, `H${r}+N${r}+P${r}+R${r}`),
      s(getSource(item.material.source.sourceId)?.short ?? ""),
      s(item.material.source.locator ?? ""),
      s(QUALITY_META[item.material.quality].label),
    ]);
  });
  const last = project.items.length + 1;
  XLSX.utils.book_append_sheet(
    wb,
    sheet(rows, [4, 36, 10, 7, 12, 9, 14, 13, 9, 10, 12, 13, 11, 12, 10, 13, 12, 13, 11, 14, 26, 30, 14]),
    "Inventory",
  );

  // Site energy.
  const energyRows: (Cell | null)[][] = [["Source", "Quantity", "Unit", "Factor (kg CO2e/unit)", "kg CO2e", "Reference"].map(s)];
  result.siteEnergy.forEach((e, i) => {
    const item = project.siteEnergy[i];
    const r = i + 2;
    energyRows.push([
      s(e.label),
      n(item.quantity),
      s(unitLabel(item.factor.unit)),
      n(item.factor.value),
      n(e.value, `B${r}*D${r}`),
      s(`${getSource(item.factor.source.sourceId)?.short ?? ""}, ${item.factor.source.locator ?? ""}`),
    ]);
  });
  const lastEnergy = result.siteEnergy.length + 1;
  XLSX.utils.book_append_sheet(wb, sheet(energyRows, [34, 10, 6, 18, 12, 50]), "Site energy");

  // Summary: module totals are SUMs over the sheets above.
  const sum = (col: string) => (last >= 2 ? `SUM(Inventory!${col}2:${col}${last})` : "0");
  const energySum = lastEnergy >= 2 ? `+SUM('Site energy'!E2:E${lastEnergy})` : "";
  const summary: (Cell | null)[][] = [
    [s("Project"), s(project.name)],
    [s("Functional unit"), s(project.scope.functionalUnit)],
    [s("Goal"), s(project.scope.goal)],
    [s("Assumptions"), s(project.scope.assumptions ?? "")],
    [s("Generated"), s(new Date().toISOString().slice(0, 10))],
    [],
    [s("Module"), s("kg CO2e")],
    [s(`${MODULE_META["A1-A3"].label} ${MODULE_META["A1-A3"].name}`), n(result.modules["A1-A3"], sum("H"))],
    [s(`${MODULE_META.A4.label} ${MODULE_META.A4.name}`), n(result.modules.A4, sum("N"))],
    [s(`${MODULE_META.A5.label} ${MODULE_META.A5.name}`), n(result.modules.A5, `${sum("P")}${energySum}`)],
    [s(`${MODULE_META["C1-C4"].label} ${MODULE_META["C1-C4"].name}`), n(result.modules["C1-C4"], sum("R"))],
    [s("Total A1–A5 + C1–C4"), n(result.total, "SUM(B8:B11)")],
    [s("D (reported separately)"), n(result.modules.D, sum("S"))],
  ];
  XLSX.utils.book_append_sheet(wb, sheet(summary, [30, 60]), "Summary");

  // Sources.
  const srcRows: (Cell | null)[][] = [["Citation", "URL", "Licence", "Accessed"].map(s)];
  for (const src of sourcesUsed(project)) srcRows.push([s(src.citation), s(src.url), s(src.license), s(src.accessed)]);
  XLSX.utils.book_append_sheet(wb, sheet(srcRows, [90, 50, 40, 12]), "Sources");

  wb.SheetNames = ["Summary", "Inventory", "Site energy", "Sources"];
  return wb;
}

export function downloadText(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadWorkbook(project: Project) {
  XLSX.writeFile(buildWorkbook(project), `${slug(project.name)}.xlsx`);
}

export function downloadProjectFile(project: Project) {
  downloadText(`${slug(project.name)}.cradle.json`, JSON.stringify(project, null, 2), "application/json");
}

export function downloadBibtex(project: Project) {
  downloadText(`${slug(project.name)}.bib`, toBibtex(sourcesUsed(project)), "application/x-bibtex");
}
