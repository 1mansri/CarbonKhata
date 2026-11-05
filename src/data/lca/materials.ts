import type { MaterialFactor } from "@/lib/lca/types";
import { INDIA_MATERIALS } from "@/data/lca/india-materials";

/**
 * A1–A3 factors for construction materials. Every value was read from the
 * cited source; where a source gives only a range, the central value is
 * the midpoint and the note says so. Ranges feed the Monte Carlo analysis.
 *
 * Indian sources first. Labels say what each value covers — a "direct plant
 * emissions" figure is not a full cradle-to-gate footprint, and the UI
 * shows that note wherever the factor is used.
 */

const MOS = { sourceId: "mos-steel-2024", locator: "Table 1.7, PDF p.52 (2023-24)" };
const CT_NOTE =
  "Direct facility emissions per tonne of product, production-weighted across Indian plants tracked by Climate TRACE (snapshot of API v6, synced 2026-11-05). Excludes purchased electricity and upstream raw-material supply, so it is lower than a cradle-to-gate EPD value.";

function steelRoute(id: string, route: string, low: number, high: number): MaterialFactor {
  return {
    id,
    name: `Crude steel, ${route} (India)`,
    category: "Steel",
    declaredUnit: "t",
    gwp: ((low + high) / 2) * 1000,
    low: low * 1000,
    high: high * 1000,
    eolGroup: "metals",
    indicator: "CO2 only",
    geography: "India",
    year: 2024,
    quality: "india-official",
    source: MOS,
    notes:
      "Central value is the midpoint of the published range. Crude (liquid) steel stage: rolling into bars or sections adds further emissions.",
  };
}

const CORE: MaterialFactor[] = [
  {
    id: "in-cement-ct-dry",
    name: "Cement, integrated dry-process plants (India)",
    category: "Cement & binders",
    declaredUnit: "t",
    gwp: 632.83,
    eolGroup: "concrete",
    indicator: "CO2e",
    geography: "India (159 plants)",
    year: 2026,
    quality: "india-live",
    source: { sourceId: "climate-trace", locator: "Sector cement, asset type integrated dry" },
    notes: CT_NOTE,
  },
  {
    id: "in-steel-avg",
    name: "Crude steel, India average",
    category: "Steel",
    declaredUnit: "t",
    gwp: 2540,
    eolGroup: "metals",
    indicator: "CO2 only",
    geography: "India",
    year: 2024,
    quality: "india-official",
    source: MOS,
    notes: "National average across all routes, 2023-24. Crude (liquid) steel stage.",
  },
  steelRoute("in-steel-bf-bof", "blast furnace–BOF", 2.2, 2.6),
  steelRoute("in-steel-coal-dri", "coal DRI–induction furnace", 2.7, 3.1),
  steelRoute("in-steel-syngas-dri", "syngas DRI–EAF", 2.5, 2.9),
  steelRoute("in-steel-gas-dri", "gas DRI–EAF", 1.4, 1.6),
  steelRoute("in-steel-scrap-eaf", "100% scrap EAF", 0.55, 0.65),
  // No Climate TRACE aluminium entry: its smelting figure moved from 14.5 to
  // 1.5 t/t between syncs as captive power was re-booked to another sector,
  // so it is not a stable A1–A3 factor. EPD and IFC values cover aluminium.
];

/** EPD and literature factors first (product-level), then national and live data. */
export const MATERIALS: MaterialFactor[] = [...INDIA_MATERIALS, ...CORE];

export function getMaterial(id: string): MaterialFactor | undefined {
  return MATERIALS.find((m) => m.id === id);
}
