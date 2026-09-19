import type { DataSourceAdapter } from "@/lib/domain/data-source-adapter";
import type {
  ActivityData,
  DataSourceInfo,
  ImpactIndicatorData,
} from "@/lib/domain/types";

const RESOURCE_ID = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"; // CPCB "Real time Air Quality Index from various locations"
const API_BASE = `https://api.data.gov.in/resource/${RESOURCE_ID}`;
const PAGE_SIZE = 1000;

interface RawAqiRecord {
  country: string;
  state: string;
  city: string;
  station: string;
  last_update: string;
  latitude: string;
  longitude: string;
  pollutant_id: string;
  min_value: string;
  max_value: string;
  avg_value: string;
}

interface DataGovInResponse {
  total: number;
  count: number;
  records: RawAqiRecord[];
}

const POLLUTANT_UNITS: Record<string, string> = {
  CO: "mg/m3",
};
const DEFAULT_POLLUTANT_UNIT = "ug/m3";

function unitFor(pollutantId: string): string {
  return POLLUTANT_UNITS[pollutantId.toUpperCase()] ?? DEFAULT_POLLUTANT_UNIT;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// data.gov.in occasionally repeats the same pollutant reading for a
// station within one page — keep one indicator per pollutant.
function dedupeByPollutant(records: RawAqiRecord[]): ImpactIndicatorData[] {
  const byPollutant = new Map<string, RawAqiRecord>();
  for (const record of records) {
    byPollutant.set(record.pollutant_id, record);
  }

  return Array.from(byPollutant.values())
    .map((r) => ({
      indicatorName: r.pollutant_id,
      value: Number(r.avg_value),
      unit: unitFor(r.pollutant_id),
      method: `CPCB CAAQMS live reading, ${r.last_update}`,
    }))
    .filter((indicator) => Number.isFinite(indicator.value));
}

export class DataGovInCpcbAdapter implements DataSourceAdapter {
  readonly info: DataSourceInfo = {
    name: "CPCB Air Quality (data.gov.in)",
    url: "https://www.data.gov.in/resource/real-time-air-quality-index-various-locations",
    licenseNote:
      "Government Open Data License - India (GODL); live CAAQMS station readings published by CPCB via data.gov.in.",
    fetchMode: "live",
    dataKind: "regulatory-monitoring",
  };

  constructor(private readonly apiKey: string) {}

  async fetch(): Promise<unknown[]> {
    const records: RawAqiRecord[] = [];
    let offset = 0;

    while (true) {
      const url = new URL(API_BASE);
      url.searchParams.set("api-key", this.apiKey);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", String(PAGE_SIZE));
      url.searchParams.set("offset", String(offset));

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(
          `data.gov.in CPCB fetch failed: ${res.status} ${res.statusText}`,
        );
      }

      const page = (await res.json()) as DataGovInResponse;
      records.push(...page.records);

      offset += page.count;
      if (page.count === 0 || offset >= page.total) break;
    }

    return records;
  }

  normalize(raw: unknown[]): ActivityData[] {
    const records = raw as RawAqiRecord[];
    const byStation = new Map<string, RawAqiRecord[]>();

    for (const record of records) {
      const key = `${record.state}|${record.city}|${record.station}`;
      const group = byStation.get(key) ?? [];
      group.push(record);
      byStation.set(key, group);
    }

    const activities: ActivityData[] = [];
    for (const [, group] of byStation) {
      const first = group[0];
      const referenceYear = parseLastUpdateYear(first.last_update);

      activities.push({
        name: `Ambient air quality — ${first.station}`,
        category: "Air Quality Monitoring",
        sector: "Environment",
        unit: "live station reading",
        geography: `${first.city}, ${first.state}, India`,
        referenceYear,
        description: `CPCB CAAQMS station at lat ${first.latitude}, lon ${first.longitude}. Last updated ${first.last_update}.`,
        externalRef: `cpcb-aqi:${slugify(first.state)}-${slugify(first.city)}-${slugify(first.station)}`,
        indicators: dedupeByPollutant(group),
      });
    }

    return activities;
  }
}

function parseLastUpdateYear(lastUpdate: string): number | null {
  // format: "DD-MM-YYYY HH:mm:ss"
  const match = /^\d{2}-\d{2}-(\d{4})/.exec(lastUpdate);
  return match ? Number(match[1]) : null;
}
