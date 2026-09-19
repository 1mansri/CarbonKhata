import type { DataSourceAdapter } from "@/lib/domain/data-source-adapter";
import type { ActivityData, DataSourceInfo } from "@/lib/domain/types";

const API_BASE = "https://api.climatetrace.org/v6/assets";
const COUNTRY = "IND";
const PAGE_LIMIT = 10000;
// Individual facilities are only surfaced by name when a (sector, asset
// type) group is small enough that each one is individually notable —
// otherwise we'd flood the DB with thousands of near-duplicate rows (e.g.
// hundreds of district-level "cattle pasture" aggregates).
const NAMED_ASSET_GROUP_CEILING = 20;

interface RawEmissionsSummary {
  Gas: string;
  ActivityUnits?: string;
  Activity?: number;
  EmissionsFactorUnits?: string;
  EmissionsFactor?: number;
  EmissionsQuantity?: number;
}

interface RawAsset {
  Id: number;
  Name: string;
  Country: string;
  Sector: string;
  AssetType: string;
  EmissionsSummary: RawEmissionsSummary[];
  Confidence?: Record<string, unknown>[];
}

interface AssetsResponse {
  assets: RawAsset[];
}

function humanize(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function latestYear(confidence: RawAsset["Confidence"]): number | null {
  if (!confidence) return null;
  const years = confidence
    .flatMap((entry) => Object.keys(entry))
    .map(Number)
    .filter((n) => Number.isFinite(n));
  return years.length > 0 ? Math.max(...years) : null;
}

/**
 * Groups facility-level emissions records into per-gas indicators keyed by
 * (Gas, unit) so mismatched units never get averaged together.
 */
function indicatorsFrom(
  assets: RawAsset[],
  method: string,
): ActivityData["indicators"] {
  const buckets = new Map<
    string,
    { gas: string; unit: string; totalFactor: number; totalActivity: number; count: number }
  >();

  for (const asset of assets) {
    for (const summary of asset.EmissionsSummary) {
      if (summary.EmissionsFactor == null || !summary.EmissionsFactorUnits) continue;
      const key = `${summary.Gas}::${summary.EmissionsFactorUnits}`;
      const bucket = buckets.get(key) ?? {
        gas: summary.Gas,
        unit: summary.EmissionsFactorUnits,
        totalFactor: 0,
        totalActivity: 0,
        count: 0,
      };
      const weight = summary.Activity ?? 1;
      bucket.totalFactor += summary.EmissionsFactor * weight;
      bucket.totalActivity += weight;
      bucket.count += 1;
      buckets.set(key, bucket);
    }
  }

  return Array.from(buckets.values()).map((bucket) => ({
    indicatorName: bucket.gas,
    value: bucket.totalActivity > 0 ? bucket.totalFactor / bucket.totalActivity : 0,
    unit: bucket.unit,
    method: `${method} (weighted avg. across ${bucket.count} record${bucket.count === 1 ? "" : "s"})`,
  }));
}

export class ClimateTraceAdapter implements DataSourceAdapter {
  readonly info: DataSourceInfo = {
    name: "Climate TRACE",
    url: "https://climatetrace.org",
    licenseNote:
      "Creative Commons Attribution 4.0 International; asset-level global emissions inventory, no API key required.",
    fetchMode: "live",
    dataKind: "emission-factor",
  };

  async fetch(): Promise<unknown[]> {
    const url = new URL(API_BASE);
    url.searchParams.set("countries", COUNTRY);
    url.searchParams.set("limit", String(PAGE_LIMIT));

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Climate TRACE fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as AssetsResponse;
    return data.assets.filter((a) => a.EmissionsSummary?.length > 0);
  }

  normalize(raw: unknown[]): ActivityData[] {
    const assets = raw as RawAsset[];
    const groups = new Map<string, RawAsset[]>();

    for (const asset of assets) {
      const key = `${asset.Sector}::${asset.AssetType}`;
      const group = groups.get(key) ?? [];
      group.push(asset);
      groups.set(key, group);
    }

    const activities: ActivityData[] = [];

    for (const [key, group] of groups) {
      const [sector, assetType] = key.split("::");
      const sectorLabel = humanize(sector);
      const year = Math.max(
        ...group.map((a) => latestYear(a.Confidence) ?? 0),
        0,
      );
      const referenceYear = year > 0 ? year : null;

      activities.push({
        name: `${sectorLabel} — ${humanize(assetType)}, India (aggregate)`,
        category: sectorLabel,
        sector,
        unit: "weighted average across facilities",
        geography: "India",
        referenceYear,
        description: `Aggregated from ${group.length} Climate TRACE-tracked facilit${group.length === 1 ? "y" : "ies"}.`,
        externalRef: `climatetrace:agg-${sector}-${assetType}`,
        indicators: indicatorsFrom(group, "Climate TRACE, aggregated"),
      });

      if (group.length <= NAMED_ASSET_GROUP_CEILING) {
        for (const asset of group) {
          activities.push({
            name: asset.Name || `${sectorLabel} facility ${asset.Id}`,
            category: sectorLabel,
            sector,
            unit: "facility record",
            geography: "India",
            referenceYear: latestYear(asset.Confidence),
            description: `${sectorLabel} (${humanize(assetType)}) facility tracked by Climate TRACE.`,
            externalRef: `climatetrace:asset-${asset.Id}`,
            indicators: indicatorsFrom([asset], "Climate TRACE, facility-level"),
          });
        }
      }
    }

    return activities;
  }
}
