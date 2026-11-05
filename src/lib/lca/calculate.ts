import { fmt } from "@/lib/lca/format";
import { toDeclaredUnit, toKg, unitLabel } from "@/lib/lca/units";
import {
  TOTAL_MODULES,
  type EnergyResult,
  type InventoryItem,
  type ItemResult,
  type ModuleValues,
  type Project,
  type ProjectResult,
  type ProjectScope,
  type SiteEnergyItem,
} from "@/lib/lca/types";

const ROUTE_LABEL = { landfill: "landfill", recycling: "recycling", incineration: "incineration" };

export function emptyModules(): ModuleValues {
  return { "A1-A3": 0, A4: 0, A5: 0, "C1-C4": 0, D: 0 };
}

export function sumTotal(modules: ModuleValues): number {
  return TOTAL_MODULES.reduce((sum, m) => sum + modules[m], 0);
}

export function itemLabel(item: InventoryItem): string {
  return item.label?.trim() || item.material.name;
}

/**
 * Embodied carbon of one inventory line, module by module. Linear by
 * design: every number is quantity × factor, and the working for each
 * module is returned as text so a researcher can check it by hand.
 */
export function calculateItem(
  item: InventoryItem,
  boundary: ProjectScope["boundary"],
): ItemResult {
  const { material } = item;
  const modules = emptyModules();
  const working: ItemResult["working"] = {};
  const warnings: string[] = [];
  const declared = unitLabel(material.declaredUnit);

  const qDeclared = toDeclaredUnit(item.quantity, item.unit, material);
  const massKg = toKg(item.quantity, item.unit, material);
  const massT = massKg == null ? null : massKg / 1000;

  // A1–A3: always inside the boundary.
  if (qDeclared == null) {
    warnings.push(
      `Can't convert ${unitLabel(item.unit)} to ${declared}: this factor has no density or unit mass.`,
    );
  } else {
    modules["A1-A3"] = qDeclared * material.gwp;
    const conversion =
      item.unit === material.declaredUnit
        ? ""
        : ` = ${fmt(qDeclared)} ${declared}`;
    working["A1-A3"] =
      `${fmt(item.quantity)} ${unitLabel(item.unit)}${conversion} × ${fmt(material.gwp)} kg CO₂e/${declared} = ${fmt(modules["A1-A3"])} kg CO₂e`;
  }

  // A4: transport to site.
  if (boundary.a4 && item.transport && item.transport.distanceKm > 0) {
    const { distanceKm, factor, payloadT } = item.transport;
    if (massT == null) {
      warnings.push("A4 needs the mass of this item, but it can't be derived from the factor.");
    } else if (factor.basis === "tkm") {
      modules.A4 = massT * distanceKm * factor.value;
      working.A4 = `${fmt(massT)} t × ${fmt(distanceKm)} km × ${fmt(factor.value)} kg CO₂e/t·km = ${fmt(modules.A4)} kg CO₂e`;
    } else if (!payloadT || payloadT <= 0) {
      warnings.push(`A4: "${factor.name}" is per vehicle-km, so it needs a payload per trip.`);
    } else {
      const trips = massT / payloadT;
      modules.A4 = trips * distanceKm * factor.value;
      working.A4 = `(${fmt(massT)} t ÷ ${fmt(payloadT)} t/trip) × ${fmt(distanceKm)} km × ${fmt(factor.value)} kg CO₂e/vehicle-km = ${fmt(modules.A4)} kg CO₂e`;
    }
  }

  // A5: on-site wastage carries the production and transport of the
  // wasted share of material.
  if (boundary.a5 && item.wastagePct && item.wastagePct > 0) {
    const share = item.wastagePct / 100;
    modules.A5 = share * (modules["A1-A3"] + modules.A4);
    working.A5 = `${fmt(item.wastagePct)}% wastage × (A1–A3 ${fmt(modules["A1-A3"])} + A4 ${fmt(modules.A4)}) = ${fmt(modules.A5)} kg CO₂e`;
  }

  // C1–C4: end of life, from the product's own EPD or a route factor.
  if (boundary.c && item.endOfLife) {
    if (item.endOfLife.kind === "epd") {
      const c = material.epdEndOfLife?.c1c4;
      if (c == null || qDeclared == null) {
        warnings.push("C1–C4: this factor's source declares no end-of-life values.");
      } else {
        modules["C1-C4"] = qDeclared * c;
        working["C1-C4"] = `${fmt(qDeclared)} ${declared} × ${fmt(c)} kg CO₂e/${declared} (EPD C1–C4) = ${fmt(modules["C1-C4"])} kg CO₂e`;
      }
    } else if (massT == null) {
      warnings.push("C1–C4 needs the mass of this item, but it can't be derived from the factor.");
    } else {
      const { factor } = item.endOfLife;
      modules["C1-C4"] = massT * factor.value;
      working["C1-C4"] = `${fmt(massT)} t × ${fmt(factor.value)} kg CO₂e/t (${ROUTE_LABEL[factor.route]}) = ${fmt(modules["C1-C4"])} kg CO₂e`;
    }
  }

  // D: benefits beyond the boundary, only where the EPD declares a non-zero value.
  const d = material.epdEndOfLife?.d;
  if (boundary.d && d && qDeclared != null) {
    modules.D = qDeclared * d;
    working.D = `${fmt(qDeclared)} ${declared} × ${fmt(d)} kg CO₂e/${declared} (EPD module D) = ${fmt(modules.D)} kg CO₂e`;
  }

  return {
    itemId: item.id,
    label: itemLabel(item),
    massKg,
    modules,
    total: sumTotal(modules),
    working,
    warnings,
  };
}

export function calculateEnergy(item: SiteEnergyItem): EnergyResult {
  const value = item.quantity * item.factor.value;
  const unit = unitLabel(item.factor.unit);
  return {
    itemId: item.id,
    label: item.factor.name,
    value,
    working: `${fmt(item.quantity)} ${unit} × ${fmt(item.factor.value)} kg CO₂e/${unit} = ${fmt(value)} kg CO₂e`,
  };
}

export function calculateProject(project: Project): ProjectResult {
  const { boundary, floorAreaM2 } = project.scope;
  const items = project.items.map((item) => calculateItem(item, boundary));
  const siteEnergy = boundary.a5 ? project.siteEnergy.map(calculateEnergy) : [];

  const modules = emptyModules();
  for (const item of items) {
    for (const key of Object.keys(modules) as (keyof ModuleValues)[]) {
      modules[key] += item.modules[key];
    }
  }
  for (const energy of siteEnergy) modules.A5 += energy.value;

  const total = sumTotal(modules);
  return {
    modules,
    total,
    items,
    siteEnergy,
    perFloorArea: floorAreaM2 && floorAreaM2 > 0 ? total / floorAreaM2 : null,
    warnings: items.flatMap((item) => item.warnings.map((w) => `${item.label}: ${w}`)),
  };
}
