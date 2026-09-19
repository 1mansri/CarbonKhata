import type {
  Activity,
  ActivityData,
  DataSourceInfo,
  DataSourceSummary,
} from "@/lib/domain/types";

export interface ActivitySearchParams {
  query?: string;
  category?: string;
  limit?: number;
}

/**
 * Everything a service needs to read/write activity data, without knowing
 * it's backed by Prisma. Services depend on this interface, not on Prisma
 * directly (dependency inversion) — swapping databases or writing tests
 * with a fake repository doesn't touch service code.
 */
export interface ActivityRepository {
  search(params: ActivitySearchParams): Promise<Activity[]>;
  findById(id: string): Promise<Activity | null>;
  upsertFromSource(
    source: DataSourceInfo,
    activities: ActivityData[],
  ): Promise<number>;
  listSources(): Promise<DataSourceSummary[]>;
}
