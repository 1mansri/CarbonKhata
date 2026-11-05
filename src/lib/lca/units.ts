import type { MaterialFactor, Unit } from "@/lib/lca/types";

type Dimension = "mass" | "volume" | "area" | "length" | "count" | "energy";

const UNITS: Record<Unit, { dimension: Dimension; scale: number; label: string }> = {
  kg: { dimension: "mass", scale: 1, label: "kg" },
  t: { dimension: "mass", scale: 1000, label: "t" },
  m3: { dimension: "volume", scale: 1, label: "m³" },
  L: { dimension: "volume", scale: 0.001, label: "L" },
  m2: { dimension: "area", scale: 1, label: "m²" },
  m: { dimension: "length", scale: 1, label: "m" },
  piece: { dimension: "count", scale: 1, label: "piece" },
  kWh: { dimension: "energy", scale: 1, label: "kWh" },
  MWh: { dimension: "energy", scale: 1000, label: "MWh" },
};

export const MATERIAL_UNITS: Unit[] = ["kg", "t", "m3", "L", "m2", "m", "piece"];

export function isUnit(value: unknown): value is Unit {
  return typeof value === "string" && value in UNITS;
}

export function unitLabel(unit: Unit): string {
  return UNITS[unit].label;
}

/** Units a quantity of this material can be entered in. */
export function compatibleUnits(material: MaterialFactor): Unit[] {
  return MATERIAL_UNITS.filter((unit) => toDeclaredUnit(1, unit, material) != null);
}

/** Mass in kg of `quantity` `unit` of `material`, or null if not derivable. */
export function toKg(quantity: number, unit: Unit, material: MaterialFactor): number | null {
  const u = UNITS[unit];
  if (u.dimension === "mass") return quantity * u.scale;

  const declared = UNITS[material.declaredUnit];
  if (u.dimension !== declared.dimension || material.massPerUnitKg == null) return null;
  const inDeclared = (quantity * u.scale) / declared.scale;
  return inDeclared * material.massPerUnitKg;
}

/**
 * `quantity` `unit` expressed in the material's declared unit, or null if
 * the conversion needs a density / unit mass the factor doesn't provide.
 */
export function toDeclaredUnit(
  quantity: number,
  unit: Unit,
  material: MaterialFactor,
): number | null {
  const u = UNITS[unit];
  const declared = UNITS[material.declaredUnit];
  if (u.dimension === declared.dimension) return (quantity * u.scale) / declared.scale;

  const kg = toKg(quantity, unit, material);
  if (kg == null) return null;
  if (declared.dimension === "mass") return kg / declared.scale;
  if (material.massPerUnitKg == null) return null;
  return kg / material.massPerUnitKg;
}
