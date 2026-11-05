import type { EolFactor, EolGroup, EolRouteKind } from "@/lib/lca/types";

/**
 * C1–C4 proxies: DESNZ 2025 waste-disposal factors (kg CO2e per tonne).
 * They follow the cut-off approach — recycling burdens go to the next
 * product — so inert materials carry little more than haulage and site
 * handling. No open Indian end-of-life dataset exists; these are labelled
 * as UK proxies everywhere they appear.
 */
const ROWS: [EolGroup, EolRouteKind, number, string][] = [
  ["aggregates", "landfill", 1.26338, "20_500_5173_15_1"],
  ["aggregates", "recycling", 1.00835, "20_500_5170_15_1"],
  ["asphalt", "landfill", 1.26338, "20_500_5194_15_1"],
  ["asphalt", "recycling", 1.00835, "20_500_5191_15_1"],
  ["bricks", "landfill", 1.26338, "20_500_5201_15_1"],
  ["bricks", "recycling", 1.00835, "20_500_5197_15_1"],
  ["concrete", "landfill", 1.26338, "20_500_5208_15_1"],
  ["concrete", "recycling", 1.00835, "20_500_5205_15_1"],
  ["insulation", "landfill", 1.26338, "20_500_5215_15_1"],
  ["insulation", "recycling", 1.00835, "20_500_5212_15_1"],
  ["metals", "landfill", 1.26435, "20_500_5222_15_1"],
  ["metals", "recycling", 1.00835, "20_500_5219_15_1"],
  ["plasterboard", "landfill", 71.95, "20_500_5243_15_1"],
  ["plasterboard", "recycling", 4.68568, "20_500_5240_15_1"],
  ["wood", "landfill", 925.34348, "20_500_5257_15_1"],
  ["wood", "recycling", 4.68568, "20_500_5254_15_1"],
  ["wood", "incineration", 4.68568, "20_500_5255_15_1"],
  ["glass", "landfill", 8.98311, "20_501_5271_15_1"],
  ["glass", "recycling", 4.68568, "20_501_5268_15_1"],
];

export const EOL_FACTORS: EolFactor[] = ROWS.map(([group, route, value, flatId]) => ({
  id: `eol-${group}-${route}`,
  group,
  route,
  value,
  indicator: "CO2e",
  geography: "United Kingdom",
  year: 2025,
  quality: "international-proxy",
  source: { sourceId: "desnz-2025", locator: `Waste disposal, flat ID ${flatId}` },
}));

export function eolOptions(group: EolGroup | undefined): EolFactor[] {
  return group ? EOL_FACTORS.filter((f) => f.group === group) : [];
}
