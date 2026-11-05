import chaudhary from "@/data/lca/validation/chaudhary-2022.json";
import type { DataQuality, EnergyFactor, InventoryItem, ModuleId, Project, Unit } from "@/lib/lca/types";

/**
 * Published studies the engine must reproduce. Each case rebuilds the
 * paper's own inventory with the paper's own factors, so a match tests the
 * calculation (units, conversions, sums) rather than the choice of data.
 * `validation.test.ts` enforces the tolerances.
 */
export interface ValidationCheck {
  module: ModuleId;
  label: string;
  /** Value published by the study, kg CO2e. */
  published: number;
  /** Allowed absolute difference, kg CO2e. */
  toleranceKg: number;
  note?: string;
}

export interface ValidationCase {
  id: string;
  title: string;
  citation: string;
  checks: ValidationCheck[];
  /** What the case does not reproduce, and why. */
  notReproduced: string;
  build: () => Omit<Project, "schemaVersion" | "id" | "createdAt" | "updatedAt">;
}

/** The paper's units → calculator unit, with how many calculator units one paper unit holds. */
const PAPER_UNITS: Record<string, { unit: Unit; per: number }> = {
  "1000 nos": { unit: "piece", per: 1000 },
  tonnes: { unit: "t", per: 1 },
  quintals: { unit: "kg", per: 100 },
  quintal: { unit: "kg", per: 100 },
  kg: { unit: "kg", per: 1 },
  m3: { unit: "m3", per: 1 },
  m2: { unit: "m2", per: 1 },
  m: { unit: "m", per: 1 },
  each: { unit: "piece", per: 1 },
  "10 Nos": { unit: "piece", per: 10 },
  "100 Nos": { unit: "piece", per: 100 },
  "10 cudm": { unit: "m3", per: 0.01 },
  litres: { unit: "L", per: 1 },
};

const host = (url: string) => url.match(/https?:\/\/([^/]+)/)?.[1] ?? "unstated";

/** IFC's India database counts as Indian data; the paper's other factors are foreign. */
const qualityOf = (url: string): DataQuality =>
  host(url) === "edgebuildings.com" ? "india-literature" : "international-proxy";

const CHAUDHARY_DIESEL: EnergyFactor = {
  id: "chaudhary-diesel",
  name: "Diesel in site machinery (as in the study)",
  unit: "L",
  value: 3.265,
  indicator: "CO2e",
  geography: "As in the study (ecoinvent)",
  year: 2022,
  quality: "international-proxy",
  source: { sourceId: "chaudhary-2022", locator: "Tables S5–S6, GWP CF 3.265 kg CO2e/L" },
};

function buildChaudhary(): ReturnType<ValidationCase["build"]> {
  const items: InventoryItem[] = chaudhary.materials.map((r) => {
    const u = PAPER_UNITS[r.unit];
    if (!u) throw new Error(`Unmapped unit "${r.unit}" in Chaudhary & Akhtar row ${r.row}`);
    return {
      id: `chaudhary-${r.row}`,
      quantity: r.quantity * u.per,
      unit: u.unit,
      material: {
        id: `chaudhary-s3-${r.row}`,
        name: r.material,
        category: "Other",
        declaredUnit: u.unit,
        gwp: r.cf / u.per,
        indicator: "CO2e",
        geography: "As in the study",
        year: 2022,
        quality: qualityOf(String(r.source)),
        source: { sourceId: "chaudhary-2022", locator: `Tables S3–S4, row ${r.row}; factor from ${host(String(r.source))}` },
      },
    };
  });

  return {
    name: "Residential quarters, Bihar (Chaudhary & Akhtar 2023)",
    scope: {
      goal: "Reproduce the published cradle-to-site embodied carbon of a medical officers' residence and nurses' quarters in Bihar, built from a CPWD bill of quantities.",
      functionalUnit: "whole building",
      boundary: { a4: false, a5: true, c: false, d: false },
      assumptions:
        "Inventory and factors exactly as published (Tables S3–S6). A4 is not modelled: the study rounds truck trips per material category. Timber carries a zero factor in the study.",
    },
    items,
    siteEnergy: [
      {
        id: "chaudhary-diesel",
        quantity: chaudhary.onsiteDieselL.reduce((s, o) => s + o.dieselL, 0),
        factor: CHAUDHARY_DIESEL,
      },
    ],
  };
}

export const VALIDATION_CASES: ValidationCase[] = [
  {
    id: "chaudhary-2022",
    title: "Residential quarters, Bihar: 78 materials from a CPWD bill of quantities",
    citation: "Chaudhary & Akhtar (2023), ACS Environmental Au 3(2):94–104",
    checks: [
      {
        module: "A1-A3",
        label: "Material production (A1–A3)",
        published: 899_412.37,
        toleranceKg: 0.5,
        note: "Table S4 total; reported as 899 t in Table 3",
      },
      {
        module: "A5",
        label: "On-site construction (A5)",
        published: 12_075.01,
        toleranceKg: 0.5,
        note: "Table S6 total; includes 0.41 kg of welding the tool can't express (entered per cm)",
      },
    ],
    notReproduced:
      "A4 transport (24.6 t, 2.6% of the total) uses whole truck trips rounded per material category; the tool allocates trips in proportion to mass, so A4 is left out of this check.",
    build: buildChaudhary,
  },
];
