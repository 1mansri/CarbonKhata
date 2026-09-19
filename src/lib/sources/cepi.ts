import type { DataSourceAdapter } from "@/lib/domain/data-source-adapter";
import type { ActivityData, DataSourceInfo } from "@/lib/domain/types";

// CPCB "Details of Comprehensive Environmental Pollution Index (CEPI)
// Scores and Status of Moratorium in Critically Polluted Areas (CPAs)".
const RESOURCE_ID = "0579cf1f-7e3b-4b15-b29a-87cf7b7c7a08";
const API_BASE = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

interface RawCepiRecord {
  status_of_moratorium: string;
  industrial_cluster_area: string;
  state: string;
  cepi_score_2009: string;
  cepi_score_2011: string;
  cepi_score_2013: string;
}

interface DataGovInResponse {
  total: number;
  count: number;
  records: RawCepiRecord[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export class CepiAdapter implements DataSourceAdapter {
  readonly info: DataSourceInfo = {
    name: "CPCB Industrial Pollution Index (data.gov.in)",
    url: "https://www.data.gov.in/resource/details-comprehensive-environmental-pollution-index-cepi-scores-and-status-moratorium",
    licenseNote:
      "Government Open Data License - India (GODL); CPCB's Comprehensive Environmental Pollution Index for critically polluted industrial clusters, via data.gov.in.",
    fetchMode: "live",
    dataKind: "regulatory-monitoring",
  };

  constructor(private readonly apiKey: string) {}

  async fetch(): Promise<unknown[]> {
    const url = new URL(API_BASE);
    url.searchParams.set("api-key", this.apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "100");

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`CEPI fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as DataGovInResponse;
    return data.records;
  }

  normalize(raw: unknown[]): ActivityData[] {
    const records = raw as RawCepiRecord[];

    return records.map((r) => ({
      name: `Industrial pollution index — ${r.industrial_cluster_area}`,
      category: "Industrial Pollution Index",
      sector: "Industrial Clusters",
      unit: "CEPI score (0-100)",
      geography: `${r.industrial_cluster_area}, ${r.state}, India`,
      referenceYear: 2013,
      description: `Status of moratorium: ${r.status_of_moratorium}.`,
      externalRef: `cpcb-cepi:${slugify(r.state)}-${slugify(r.industrial_cluster_area)}`,
      indicators: (
        [
          ["CEPI score (2009)", r.cepi_score_2009],
          ["CEPI score (2011)", r.cepi_score_2011],
          ["CEPI score (2013)", r.cepi_score_2013],
        ] as const
      )
        .filter(([, value]) => value != null && value !== "" && Number.isFinite(Number(value)))
        .map(([indicatorName, value]) => ({
          indicatorName,
          value: Number(value),
          unit: "CEPI score (0-100)",
          method: "CPCB Comprehensive Environmental Pollution Index",
        })),
    }));
  }
}
