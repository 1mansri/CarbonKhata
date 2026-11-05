import type { MaterialFactor, Unit } from "@/lib/lca/types";
import type { RawRow } from "@/lib/domain/cleaning-rule";

/**
 * Bill-of-quantities import: find the description / quantity / unit
 * columns, read Indian BoQ units, and suggest a library material per row.
 * Suggestions are only suggestions — the review table makes the call.
 */

export interface BoqColumns {
  description?: string;
  quantity?: string;
  unit?: string;
}

/** Serial-number headers ("Item No.", "Sl No", "S.No") that must never be read as data. */
const SERIAL = /\b(no|sl|sr|s\.?\s?no|sno)\b\.?|#/i;

export function detectColumns(columns: string[]): BoqColumns {
  // Try the most specific header patterns first; CPWD sheets often put
  // "Item No." before "Description of item" and "Amount" (money) after "Qty".
  const find = (...patterns: RegExp[]) => {
    for (const re of patterns) {
      const hit = columns.find((c) => re.test(c) && !SERIAL.test(c));
      if (hit) return hit;
    }
    return undefined;
  };
  return {
    description: find(/desc|particular/i, /item|material|name|activity/i),
    quantity: find(/qty|quantity/i, /quant/i),
    unit: find(/^unit|uom|unit$/i),
  };
}

/**
 * Units seen in Indian BoQs (CPWD-style) mapped to calculator units.
 * `factor` converts the BoQ quantity into the returned unit — e.g. a
 * quintal is 100 kg, and a cement bag is 50 kg.
 */
const UNIT_MAP: Record<string, { unit: Unit; factor: number }> = {
  kg: { unit: "kg", factor: 1 },
  kgs: { unit: "kg", factor: 1 },
  kilogram: { unit: "kg", factor: 1 },
  t: { unit: "t", factor: 1 },
  mt: { unit: "t", factor: 1 },
  tonne: { unit: "t", factor: 1 },
  tonnes: { unit: "t", factor: 1 },
  ton: { unit: "t", factor: 1 },
  qtl: { unit: "kg", factor: 100 },
  quintal: { unit: "kg", factor: 100 },
  bag: { unit: "kg", factor: 50 },
  bags: { unit: "kg", factor: 50 },
  cum: { unit: "m3", factor: 1 },
  "cu.m": { unit: "m3", factor: 1 },
  "cu m": { unit: "m3", factor: 1 },
  m3: { unit: "m3", factor: 1 },
  "m³": { unit: "m3", factor: 1 },
  sqm: { unit: "m2", factor: 1 },
  "sq.m": { unit: "m2", factor: 1 },
  "sq m": { unit: "m2", factor: 1 },
  m2: { unit: "m2", factor: 1 },
  "m²": { unit: "m2", factor: 1 },
  m: { unit: "m", factor: 1 },
  rm: { unit: "m", factor: 1 },
  rmt: { unit: "m", factor: 1 },
  metre: { unit: "m", factor: 1 },
  meter: { unit: "m", factor: 1 },
  l: { unit: "L", factor: 1 },
  ltr: { unit: "L", factor: 1 },
  litre: { unit: "L", factor: 1 },
  litres: { unit: "L", factor: 1 },
  liter: { unit: "L", factor: 1 },
  nos: { unit: "piece", factor: 1 },
  "no.": { unit: "piece", factor: 1 },
  no: { unit: "piece", factor: 1 },
  each: { unit: "piece", factor: 1 },
  pcs: { unit: "piece", factor: 1 },
  piece: { unit: "piece", factor: 1 },
};

export function parseBoqUnit(text: string): { unit: Unit; factor: number } | null {
  return UNIT_MAP[text.trim().toLowerCase().replace(/\s+/g, " ")] ?? null;
}

export function parseQuantity(value: RawRow[string]): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const n = Number(value.replace(/,/g, "").trim());
  return value.trim() !== "" && Number.isFinite(n) ? n : null;
}

export interface BoqLine {
  text: string;
  quantity: number | null;
  unit: { unit: Unit; factor: number } | null;
  rawUnit: string;
  match: MaterialFactor | null;
  /** Match confidence, 0 (none) to 1 (every word accounted for). */
  confidence: number;
}

/** Words BoQ descriptions and factor names use that say nothing about the material. */
const STOP = new Set(
  "a an and as at by for from in of on or the to with providing laying fixing including complete work grade item supply india indian generic mean average epds".split(
    " ",
  ),
);

/** BoQ vocabulary → the word the library uses. */
const SYNONYMS: Record<string, string> = {
  pozzolana: "ppc",
  pozzolona: "ppc",
  reinforcement: "rebar",
  bar: "rebar",
  rebars: "rebar",
  slag: "psc",
  flyash: "fly",
};

export function tokens(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/ready[\s-]?mix(ed)?/g, "rmc")
    .replace(/fly[\s-]?ash/g, "fly ash")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w))
    .map((w) => SYNONYMS[w] ?? w)
    .filter((w) => !STOP.has(w));
  return new Set(words);
}

/**
 * How well a material explains a BoQ description: mostly "how much of the
 * description is covered", partly "how specific the material is", plus a
 * small preference for generic Indian values when the brand is unknown.
 */
function score(desc: Set<string>, material: MaterialFactor): number {
  const name = tokens(material.name);
  // Category words ("Aggregates & sand") only break ties: half weight.
  const category = [...tokens(material.category)].filter((t) => !name.has(t));
  let nameHits = 0;
  for (const t of desc) if (name.has(t)) nameHits++;
  const categoryHits = category.filter((t) => desc.has(t)).length;
  if (nameHits + categoryHits === 0 || desc.size === 0) return 0;
  const generic = /generic|mean of|average/i.test(material.name) ? 0.05 : 0;
  return 0.6 * ((nameHits + 0.5 * categoryHits) / desc.size) + 0.4 * (nameHits / name.size) + generic;
}

export function matchBoq(rows: RawRow[], columns: BoqColumns, materials: MaterialFactor[]): BoqLine[] {
  return rows
    .map((row) => {
      const text = String(columns.description ? (row[columns.description] ?? "") : "").trim();
      const rawUnit = String(columns.unit ? (row[columns.unit] ?? "") : "").trim();
      const desc = tokens(text);
      let best: { m: MaterialFactor; s: number } | null = null;
      for (const m of materials) {
        const s = score(desc, m);
        if (s > (best?.s ?? 0)) best = { m, s };
      }
      let unit = rawUnit ? parseBoqUnit(rawUnit) : null;
      // A 50 kg bag is a cement convention; a "bag" of anything else is unknown.
      if (/^bags?$/i.test(rawUnit) && best?.m.category !== "Cement & binders") unit = null;
      return {
        text,
        quantity: columns.quantity ? parseQuantity(row[columns.quantity]) : null,
        unit,
        rawUnit,
        match: best?.m ?? null,
        confidence: Math.min(1, best?.s ?? 0),
      };
    })
    .filter((line) => line.text !== "");
}
