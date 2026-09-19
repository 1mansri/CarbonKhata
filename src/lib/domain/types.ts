/**
 * Plain data shapes shared across the app. These mirror the Prisma models
 * but stay decoupled from Prisma so adapters/services can be typed without
 * importing the generated client everywhere.
 */

export interface ImpactIndicatorData {
  indicatorName: string;
  value: number;
  unit: string;
  method?: string | null;
}

export interface ActivityData {
  name: string;
  category?: string | null;
  sector?: string | null;
  unit: string;
  geography?: string | null;
  referenceYear?: number | null;
  description?: string | null;
  /**
   * A stable identifier for this activity within its source (e.g. the
   * source's own resource/row id, or a deterministic slug of its name).
   * Adapters MUST set this — it's the dedup key `upsertFromSource` uses so
   * re-syncing doesn't create duplicate rows.
   */
  externalRef: string;
  indicators: ImpactIndicatorData[];
}

export interface Activity extends ActivityData {
  id: string;
  sourceId: string;
  sourceName: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FetchMode = "live" | "periodic-import" | "user-upload";

export interface DataSourceInfo {
  name: string;
  url?: string;
  licenseNote?: string;
  fetchMode: FetchMode;
}

export interface DataSourceSummary extends DataSourceInfo {
  id: string;
  lastSyncedAt: Date | null;
  activityCount: number;
}
