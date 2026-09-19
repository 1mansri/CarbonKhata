import type { DataSourceAdapter } from "@/lib/domain/data-source-adapter";
import type { ActivityData, DataSourceInfo } from "@/lib/domain/types";

const API_BASE = "https://api.ember-energy.org/v1";
const ENTITY = "India";

// Aggregate rows (Clean, Fossil, Renewables, Demand, Total generation, ...)
// double-count the underlying fuel-type rows — excluded to keep this to
// one signal per fuel type, not noise.
const EXCLUDED_SERIES = new Set([
  "Clean",
  "Fossil",
  "Renewables",
  "Demand",
  "Total generation",
  "Wind and solar",
  "Hydro, bioenergy and other renewables",
]);

interface RawGenerationRow {
  entity: string;
  date: string;
  series: string;
  is_aggregate_series: boolean;
  generation_twh: number;
  share_of_generation_pct: number;
}

interface RawCarbonIntensityRow {
  entity: string;
  date: string;
  emissions_intensity_gco2_per_kwh: number;
}

interface EmberResponse<T> {
  data: T[];
}

interface EmberRawData {
  generation: RawGenerationRow[];
  carbonIntensity: RawCarbonIntensityRow[];
}

async function fetchJson<T>(path: string, apiKey: string): Promise<EmberResponse<T>> {
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("entity", ENTITY);
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Ember fetch failed (${path}): ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<EmberResponse<T>>;
}

/**
 * India's grid electricity carbon intensity and generation mix — the
 * background emission factor almost every product LCA needs somewhere
 * in its inventory. Deliberately narrow: one country, one activity, the
 * latest year only. No historical time series, no per-series noise from
 * Ember's aggregate rows.
 */
export class EmberAdapter implements DataSourceAdapter {
  readonly info: DataSourceInfo = {
    name: "Ember (grid electricity)",
    url: "https://ember-energy.org/data/api/",
    licenseNote:
      "Ember Data API; global electricity generation, emissions, and carbon intensity data, CC BY 4.0.",
    fetchMode: "live",
    dataKind: "emission-factor",
  };

  constructor(private readonly apiKey: string) {}

  async fetch(): Promise<unknown[]> {
    const [generation, carbonIntensity] = await Promise.all([
      fetchJson<RawGenerationRow>("/electricity-generation/yearly", this.apiKey),
      fetchJson<RawCarbonIntensityRow>("/carbon-intensity/yearly", this.apiKey),
    ]);

    const raw: EmberRawData = {
      generation: generation.data,
      carbonIntensity: carbonIntensity.data,
    };
    return [raw];
  }

  normalize(raw: unknown[]): ActivityData[] {
    const { generation, carbonIntensity } = raw[0] as EmberRawData;

    if (carbonIntensity.length === 0) return [];

    const latestYear = Math.max(...carbonIntensity.map((r) => Number(r.date)));
    const latestIntensity = carbonIntensity.find((r) => Number(r.date) === latestYear);
    if (!latestIntensity) return [];

    const mix = generation.filter(
      (r) =>
        Number(r.date) === latestYear &&
        !r.is_aggregate_series &&
        !EXCLUDED_SERIES.has(r.series),
    );

    return [
      {
        name: `Grid electricity — ${ENTITY}`,
        category: "Electricity Generation",
        sector: "Power and Energy",
        unit: "gCO2/kWh",
        geography: ENTITY,
        referenceYear: latestYear,
        description: `India's national grid electricity carbon intensity and generation mix, ${latestYear}.`,
        externalRef: `ember:grid-electricity-${ENTITY.toLowerCase()}`,
        indicators: [
          {
            indicatorName: "Carbon intensity",
            value: latestIntensity.emissions_intensity_gco2_per_kwh,
            unit: "gCO2/kWh",
            method: `Ember, ${latestYear}`,
          },
          ...mix.map((r) => ({
            indicatorName: `${r.series} share of generation`,
            value: r.share_of_generation_pct,
            unit: "%",
            method: `Ember, ${latestYear}`,
          })),
        ],
      },
    ];
  }
}
