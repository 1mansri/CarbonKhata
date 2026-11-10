/**
 * Domain types for the embodied-carbon calculator. Pure data shapes, no
 * React or Prisma, so the engine can run (and be tested) anywhere.
 *
 * Module structure follows EN 15804+A2: A1–A3 product stage, A4 transport
 * to site, A5 construction, C1–C4 end of life, D beyond the system boundary
 * (reported separately, never added to totals). B1–B7 (use stage) is out of
 * scope.
 */

export type ModuleId = "A1-A3" | "A4" | "A5" | "C1-C4" | "D";

/** Modules that add up to the reported total. D is always separate. */
export const TOTAL_MODULES = ["A1-A3", "A4", "A5", "C1-C4"] as const satisfies readonly ModuleId[];

export type Unit = "kg" | "t" | "m3" | "L" | "m2" | "m" | "piece" | "kWh" | "MWh";

/**
 * How trustworthy / representative a value is for an Indian study. Shown on
 * every factor and summarised in the report's data-quality section.
 */
export type DataQuality =
  | "india-epd" // third-party verified EPD of an Indian product
  | "india-official" // Government of India / CEA / ministry publication
  | "india-literature" // peer-reviewed study of Indian production
  | "india-live" // live API data for India (Climate TRACE, Ember)
  | "ipcc-default" // IPCC default value
  | "international-proxy" // non-Indian value used for lack of an Indian one
  | "user"; // entered by the researcher

/** Which GWP indicator the source actually reports. */
export type GwpIndicator = "GWP-total" | "GWP-fossil" | "CO2e" | "CO2 only";

export interface SourceRef {
  sourceId: string;
  /** Table / page / sheet inside the source, e.g. "Table 1.7, p.52". */
  locator?: string;
}

interface Provenance {
  indicator: GwpIndicator;
  geography: string;
  /** Reference year of the data (not the publication year). */
  year: number;
  quality: DataQuality;
  source: SourceRef;
  notes?: string;
}

export type MaterialCategory =
  | "Cement & binders"
  | "Concrete"
  | "Steel"
  | "Bricks & blocks"
  | "Aggregates & sand"
  | "Metals"
  | "Glass"
  | "Finishes"
  | "Other";

/** Material groups for which an end-of-life route factor exists. */
export type EolGroup =
  | "aggregates"
  | "bricks"
  | "concrete"
  | "metals"
  | "plasterboard"
  | "wood"
  | "glass"
  | "insulation"
  | "asphalt";

export type EolRouteKind = "landfill" | "recycling" | "incineration";

/** A cradle-to-gate (A1–A3) factor for one material or product. */
export interface MaterialFactor extends Provenance {
  id: string;
  name: string;
  category: MaterialCategory;
  declaredUnit: Unit;
  /** kg CO2e per declared unit, A1–A3. */
  gwp: number;
  /** Published or observed range, same unit as `gwp`. */
  low?: number;
  high?: number;
  /**
   * Mass of one declared unit in kg, needed whenever the declared unit is
   * not a mass (density for m³, mass per m² or per piece).
   */
  massPerUnitKg?: number;
  /** C1–C4 and D as declared by an EPD, kg CO2e per declared unit. */
  epdEndOfLife?: { c1c4?: number; d?: number };
  /** LCA background database behind an EPD or dataset (e.g. "ecoinvent 3.8"). */
  backgroundDb?: string;
  eolGroup?: EolGroup;
}

/** Freight factor for A4. `tkm` = per tonne-km, `vkm` = per vehicle-km. */
export interface TransportFactor extends Provenance {
  id: string;
  name: string;
  basis: "tkm" | "vkm";
  /** kg CO2e per t·km or per vehicle-km. */
  value: number;
  low?: number;
  high?: number;
}

/** Electricity, fuel or water used on site (A5). */
export interface EnergyFactor extends Provenance {
  id: string;
  name: string;
  unit: "kWh" | "L" | "m3";
  /** kg CO2e per unit. */
  value: number;
  low?: number;
  high?: number;
}

/** End-of-life route factor (C1–C4 proxy), kg CO2e per tonne of waste. */
export interface EolFactor extends Provenance {
  id: string;
  group: EolGroup;
  route: EolRouteKind;
  value: number;
}

export interface TransportLeg {
  distanceKm: number;
  factor: TransportFactor;
  /** Payload per trip in tonnes; required for `vkm` factors. */
  payloadT?: number;
}

export type EndOfLifeChoice =
  | { kind: "epd" }
  | { kind: "route"; factor: EolFactor };

/**
 * One line of the inventory. Each factor is a frozen copy taken when the
 * line was added, so a saved project reproduces the exact numbers it was
 * calculated with even after the library is updated.
 */
export interface InventoryItem {
  id: string;
  label?: string;
  quantity: number;
  unit: Unit;
  material: MaterialFactor;
  transport?: TransportLeg;
  /** Share of the installed quantity wasted on site, in %. */
  wastagePct?: number;
  endOfLife?: EndOfLifeChoice;
  /**
   * Set while the quantity is an AI estimate: the model's stated basis.
   * Cleared as soon as the user edits the quantity themselves.
   */
  aiBasis?: string;
}

export interface SiteEnergyItem {
  id: string;
  quantity: number;
  factor: EnergyFactor;
}

export interface ProjectScope {
  goal: string;
  functionalUnit: string;
  /** Which optional modules are inside the system boundary. */
  boundary: { a4: boolean; a5: boolean; c: boolean; d: boolean };
  /** Optional normalisation, e.g. gross floor area for kg CO2e/m². */
  floorAreaM2?: number;
  assumptions?: string;
}

export interface Project {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  scope: ProjectScope;
  items: InventoryItem[];
  siteEnergy: SiteEnergyItem[];
}

export type ModuleValues = Record<ModuleId, number>;

export interface ItemResult {
  itemId: string;
  label: string;
  /** Mass of the installed quantity in kg, if it could be derived. */
  massKg: number | null;
  modules: ModuleValues;
  /** A1–A5 + C1–C4 (D excluded). */
  total: number;
  /** Human-readable working for each non-zero module. */
  working: Partial<Record<ModuleId, string>>;
  warnings: string[];
}

export interface EnergyResult {
  itemId: string;
  label: string;
  value: number;
  working: string;
}

export interface ProjectResult {
  modules: ModuleValues;
  /** A1–A5 + C1–C4 (D excluded, per EN 15804+A2). */
  total: number;
  items: ItemResult[];
  siteEnergy: EnergyResult[];
  /** total ÷ floor area, when a floor area is set. */
  perFloorArea: number | null;
  warnings: string[];
}
