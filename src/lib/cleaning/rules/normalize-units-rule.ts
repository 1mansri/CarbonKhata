import type {
  CleaningRule,
  CleaningRuleResult,
  RawRow,
} from "@/lib/domain/cleaning-rule";

const UNIT_SYNONYMS: Record<string, string> = {
  kg: "kg",
  kgs: "kg",
  kilogram: "kg",
  kilograms: "kg",
  g: "g",
  gram: "g",
  grams: "g",
  t: "t",
  tonne: "t",
  tonnes: "t",
  ton: "t",
  tons: "t",
  kwh: "kWh",
  "kw-h": "kWh",
  mwh: "MWh",
  mj: "MJ",
  megajoule: "MJ",
  megajoules: "MJ",
  gj: "GJ",
  l: "L",
  litre: "L",
  litres: "L",
  liter: "L",
  liters: "L",
  "ug/m3": "ug/m3",
  "µg/m3": "ug/m3",
  "microgram/m3": "ug/m3",
  "mcg/m3": "ug/m3",
  "mg/m3": "mg/m3",
  tco2: "tCO2",
  "t co2": "tCO2",
  tco2e: "tCO2e",
  "t co2e": "tCO2e",
  kgco2e: "kgCO2e",
  "kg co2e": "kgCO2e",
};

/**
 * Normalizes common unit synonyms (only in columns whose header contains
 * "unit") so "Kgs", "kilogram", "KG" etc. collapse to one canonical form.
 */
export class NormalizeUnitsRule implements CleaningRule {
  readonly name = "Normalize units";

  apply(rows: RawRow[]): CleaningRuleResult {
    const notes: CleaningRuleResult["notes"] = [];

    const cleaned = rows.map((row, rowIndex) => {
      const next: RawRow = { ...row };
      for (const [column, value] of Object.entries(row)) {
        if (!/unit/i.test(column) || typeof value !== "string") continue;
        const key = value.trim().toLowerCase();
        const normalized = UNIT_SYNONYMS[key];
        if (normalized && normalized !== value) {
          next[column] = normalized;
          notes.push({
            rowIndex,
            column,
            message: `Normalized unit "${value}" → "${normalized}"`,
          });
        }
      }
      return next;
    });

    return { rows: cleaned, notes };
  }
}
