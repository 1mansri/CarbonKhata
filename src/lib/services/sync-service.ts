import type { ActivityRepository } from "@/lib/domain/activity-repository";
import type { DataSourceAdapter } from "@/lib/domain/data-source-adapter";

export interface SyncResult {
  source: string;
  activityCount: number;
}

/**
 * Runs one adapter end to end: fetch raw records, normalize them, and
 * upsert into the repository. Both the seed script and the
 * `/api/sync/cpcb` refresh endpoint call this — the "how to sync a source"
 * logic lives in exactly one place.
 */
export class SyncService {
  constructor(private readonly repository: ActivityRepository) {}

  async sync(adapter: DataSourceAdapter): Promise<SyncResult> {
    const raw = await adapter.fetch();
    const activities = adapter.normalize(raw);
    const activityCount = await this.repository.upsertFromSource(
      adapter.info,
      activities,
    );

    return { source: adapter.info.name, activityCount };
  }
}
