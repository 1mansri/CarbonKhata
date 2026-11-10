import { getMaterial } from "@/data/lca/materials";
import type { Unit } from "@/lib/lca/types";

/**
 * Construction assemblies with their material consumption per unit of work,
 * read from CPWD's Analysis of Rates. They feed the demo templates and
 * expand the AI draft (the model only sizes assemblies; these coefficients
 * turn a size into materials).
 *
 * Coefficients are entered exactly as printed. Conversions to kg (the
 * library factors are per kg or per tonne) use the cited densities in
 * DENSITY below, and every expanded line carries its working.
 *
 * Every value below was checked against the page image of its source.
 */

export const QUANTITY_SOURCES = {
  dar2014:
    "CPWD (2014). Analysis of Rates for Delhi, Vol. 1. Central Public Works Department, Government of India. https://cpwd.gov.in/WriteReadData/Publication/DAR14-Vol1.pdf (latest edition CPWD publishes free on cpwd.gov.in).",
  dsr2014:
    "CPWD (2014). Delhi Schedule of Rates 2014, Coefficients for Cement Consumption. https://cpwd.gov.in/WriteReadData/Publication/DSR14.pdf",
  is875:
    "IS 875 (Part 1):1987, Code of practice for design loads: dead loads, unit weights of building materials. Bureau of Indian Standards. Via Public.Resource.Org.",
  is1077:
    "IS 1077:1992, Common burnt clay building bricks: specification. Bureau of Indian Standards. Via Public.Resource.Org.",
  is12894:
    "IS 12894:2002, Pulverized fuel ash-lime bricks: specification. Bureau of Indian Standards. Via Public.Resource.Org.",
  ifc2017: "IFC (2017). India Construction Materials Database of Embodied Energy and Global Warming Potential, Table 18.",
} as const;

/** Densities and unit masses that turn CPWD volumes and counts into kg. */
export const DENSITY = {
  /** IS 875 (Part 1) Table 1, item 3 "Sand: Dry, clean" 1 540 to 1 600 kg/m³ (printed p.4): midpoint. */
  sandKgM3: 1570,
  /** IS 875 (Part 1) Table 1, item 2 "Broken stone ballast: Dry, well-shaken" 1 600 to 1 870 kg/m³ (p.4): midpoint. */
  aggregateKgM3: 1735,
  /**
   * Non-modular brick 230 × 110 × 70 mm (IS 1077 cl. 6.1.2, p.1; IS 12894 cl. 5.2(b) gives the same
   * size by tolerance per 20 bricks) at 1 760 kg/m³, the density IFC 2017 (Table 18) used for both its
   * clay-brick and FaL-G factors, inside IS 875's 1 600 to 1 920 kg/m³ for common burnt clay bricks
   * (Table 1 item 13, p.6). Frogs are ignored, so this slightly overstates the mass.
   */
  brickVolumeM3: 0.23 * 0.11 * 0.07,
  brickKgM3: 1760,
  /** IFC 2017 Table 18: density behind its AAC factor. */
  aacKgM3: 500,
} as const;

export const BRICK_KG = DENSITY.brickVolumeM3 * DENSITY.brickKgM3;

/** Cement mortar per m³: DAR 2014 sub-head 3 (mortars). */
const MORTAR = {
  "1:6": { cementT: 0.25, sandM3: 1.07, item: "DAR 2014 item 3.11, p.119" },
  "1:4": { cementT: 0.38, sandM3: 1.07, item: "DAR 2014 item 3.9, p.118" },
} as const;

type Ingredient =
  | { kind: "cement"; t: number }
  | { kind: "sand"; m3: number }
  | { kind: "aggregate"; m3: number }
  | { kind: "bricks"; count: number; brick: "clay" | "falg" }
  | { kind: "aac"; m3: number }
  | { kind: "steel"; kg: number }
  | { kind: "mortar"; m3: number; mix: keyof typeof MORTAR };

export interface Assembly {
  id: string;
  name: string;
  /** Unit of work the coefficients are given for. */
  unit: Unit;
  /** CPWD item and page the coefficients come from. */
  source: string;
  ingredients: Ingredient[];
  /** Anything in the CPWD analysis that is not carried into the inventory, and why. */
  note?: string;
}

export const ASSEMBLIES: Assembly[] = [
  {
    id: "brick-clay-cm16",
    name: "Clay brickwork in cement mortar 1:6",
    unit: "m3",
    source: "CPWD DAR 2014 item 6.4.2 (common burnt clay F.P.S. non-modular bricks, class 7.5, superstructure), p.234",
    ingredients: [
      { kind: "bricks", count: 494, brick: "clay" },
      { kind: "mortar", m3: 0.25, mix: "1:6" },
    ],
  },
  {
    id: "brick-falg-cm16",
    name: "Fly ash–lime (FaL-G) brickwork in cement mortar 1:6",
    unit: "m3",
    source: "CPWD DAR 2014 item 6.34.2 (non-modular FaL-G bricks to IS 12894, class 10, superstructure), p.255",
    ingredients: [
      { kind: "bricks", count: 487, brick: "falg" },
      { kind: "mortar", m3: 0.22, mix: "1:6" },
    ],
    note: "DSR 2014 lists 0.625 quintal of cement for this item, which matches 0.25 m³ of mortar; DAR's own analysis uses 0.22 m³ (0.55 quintal). DAR is followed here.",
  },
  {
    id: "aac-cm14",
    name: "AAC block masonry in cement mortar 1:4",
    unit: "m3",
    source: "CPWD DAR 2014 item 6.38 (100 mm AAC blocks, superstructure, 2 nos 6 mm bars every third course), pp.257–258",
    ingredients: [
      { kind: "aac", m3: 1.0 },
      { kind: "mortar", m3: 0.15, mix: "1:4" },
      { kind: "steel", kg: 13.2 },
    ],
  },
  {
    id: "concrete-m25-design",
    name: "M25 design-mix concrete, batched on site",
    unit: "m3",
    source: "CPWD DAR 2014 item 5.33.1 (design mix M25, cement content 330 kg/m³), p.207",
    ingredients: [
      { kind: "cement", t: 0.33 },
      { kind: "sand", m3: 0.425 },
      { kind: "aggregate", m3: 0.57 + 0.28 },
    ],
    note: "Excludes 1.65 kg/m³ of plasticiser (no open Indian factor) and reinforcement, which depends on the design.",
  },
];

export function getAssembly(id: string): Assembly | undefined {
  return ASSEMBLIES.find((a) => a.id === id);
}

/** Library factors used for each ingredient. */
const MATERIAL_FOR = {
  cement: "in-epd-mean-opc",
  sand: "ifc2017-sand",
  aggregate: "ifc2017-aggregate",
  clay: "ifc2017-brick-avg",
  falg: "ifc2017-falg",
  aac: "ifc2017-aircrete",
  steel: "ifc2017-rebar",
} as const;

export interface AssemblyLine {
  label: string;
  materialId: string;
  quantity: number;
  unit: Unit;
  /** How the quantity follows from the source, for one unit of work. */
  working: string;
}

const r = (n: number, d = 3) => Number(n.toFixed(d));

/** Materials for `quantity` units of an assembly, mortar split into cement and sand. */
export function expandAssembly(assembly: Assembly, quantity: number): AssemblyLine[] {
  const lines: AssemblyLine[] = [];
  const add = (label: string, materialId: string, perUnit: number, unit: Unit, working: string) =>
    lines.push({ label, materialId, quantity: r(perUnit * quantity, 4), unit, working });

  for (const ing of assembly.ingredients) {
    switch (ing.kind) {
      case "cement":
        add("Cement (OPC)", MATERIAL_FOR.cement, ing.t, "t", `${ing.t} t cement per ${assembly.unit} (${assembly.source})`);
        break;
      case "sand":
        add("Sand", MATERIAL_FOR.sand, ing.m3 * DENSITY.sandKgM3, "kg",
          `${ing.m3} m³ sand (${assembly.source}) × ${DENSITY.sandKgM3} kg/m³ (IS 875-1)`);
        break;
      case "aggregate":
        add("Coarse aggregate", MATERIAL_FOR.aggregate, ing.m3 * DENSITY.aggregateKgM3, "kg",
          `${r(ing.m3)} m³ aggregate (${assembly.source}) × ${DENSITY.aggregateKgM3} kg/m³ (IS 875-1)`);
        break;
      case "bricks":
        add(ing.brick === "clay" ? "Clay bricks" : "FaL-G bricks", MATERIAL_FOR[ing.brick], ing.count * BRICK_KG, "kg",
          `${ing.count} bricks (${assembly.source}) × ${r(BRICK_KG, 2)} kg (230×110×70 mm × ${DENSITY.brickKgM3} kg/m³)`);
        break;
      case "aac":
        add("AAC blocks", MATERIAL_FOR.aac, ing.m3 * DENSITY.aacKgM3, "kg",
          `${ing.m3} m³ blocks (${assembly.source}) × ${DENSITY.aacKgM3} kg/m³ (IFC 2017)`);
        break;
      case "steel":
        add("Bed-joint steel bars", MATERIAL_FOR.steel, ing.kg, "kg", `${ing.kg} kg (${assembly.source})`);
        break;
      case "mortar": {
        const m = MORTAR[ing.mix];
        add(`Cement for mortar ${ing.mix}`, MATERIAL_FOR.cement, ing.m3 * m.cementT, "t",
          `${ing.m3} m³ mortar (${assembly.source}) × ${m.cementT} t/m³ (${m.item})`);
        add(`Sand for mortar ${ing.mix}`, MATERIAL_FOR.sand, ing.m3 * m.sandM3 * DENSITY.sandKgM3, "kg",
          `${ing.m3} m³ mortar × ${m.sandM3} m³ sand/m³ (${m.item}) × ${DENSITY.sandKgM3} kg/m³ (IS 875-1)`);
        break;
      }
    }
  }
  return lines;
}

/** Fails loudly if a library id used above disappears. */
export function assemblyMaterialsExist(): string[] {
  return Object.values(MATERIAL_FOR).filter((id) => !getMaterial(id));
}
