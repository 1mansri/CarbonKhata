import type { EnergyFactor } from "@/lib/lca/types";

/**
 * A5 site energy and water. CEA's weighted average is operational CO2 per
 * kWh of net generation (no transmission & distribution losses) — the
 * figure Indian studies cite as "the grid emission factor".
 */
export const SITE_FACTORS: EnergyFactor[] = [
  {
    id: "in-grid-2025-26",
    name: "Grid electricity, India FY2025-26",
    unit: "kWh",
    value: 0.6751,
    indicator: "CO2 only",
    geography: "India",
    year: 2026,
    quality: "india-official",
    source: { sourceId: "cea-v22", locator: "Table S / Table 4, weighted average incl. imports" },
    notes: "Includes renewables and captive injection; excludes T&D losses.",
  },
  {
    id: "in-grid-2024-25",
    name: "Grid electricity, India FY2024-25",
    unit: "kWh",
    value: 0.7101,
    indicator: "CO2 only",
    geography: "India",
    year: 2025,
    quality: "india-official",
    source: { sourceId: "cea-v22", locator: "Appendix C Table B, p.28" },
  },
  {
    id: "in-grid-2023-24",
    name: "Grid electricity, India FY2023-24",
    unit: "kWh",
    value: 0.7272,
    indicator: "CO2 only",
    geography: "India",
    year: 2024,
    quality: "india-official",
    source: { sourceId: "cea-v22", locator: "Appendix C Table B, p.28" },
  },
  {
    id: "diesel-litre",
    name: "Diesel burned on site (generator, plant)",
    unit: "L",
    value: 2.66155,
    indicator: "CO2e",
    geography: "United Kingdom",
    year: 2025,
    quality: "international-proxy",
    source: { sourceId: "desnz-2025", locator: "Fuels, Diesel (100% mineral diesel), flat ID 1_101_1012_8_1" },
    notes: "Combustion only (CO2, CH4, N2O). Mineral diesel matches Indian supply.",
  },
  {
    id: "water-supply",
    name: "Mains water (e.g. curing)",
    unit: "m3",
    value: 0.1913,
    indicator: "CO2e",
    geography: "United Kingdom",
    year: 2025,
    quality: "international-proxy",
    source: { sourceId: "desnz-2025", locator: "Sheet 'Water supply', flat ID 17_404_4005_1_1" },
  },
];
