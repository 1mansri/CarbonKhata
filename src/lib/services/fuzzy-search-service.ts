import Fuse, { type IFuseOptions } from "fuse.js";
import type { ActivityRepository } from "@/lib/domain/activity-repository";
import type { Activity } from "@/lib/domain/types";

export interface FuzzySearchResult {
  activities: Activity[];
  /** false when nothing matched precisely and these are "related" suggestions instead. */
  exactMatch: boolean;
}

const FUSE_OPTIONS: IFuseOptions<Activity> = {
  keys: [
    { name: "name", weight: 0.5 },
    { name: "category", weight: 0.2 },
    { name: "sector", weight: 0.15 },
    { name: "geography", weight: 0.1 },
    { name: "indicators.indicatorName", weight: 0.05 },
  ],
  ignoreLocation: true,
  minMatchCharLength: 2,
  threshold: 0.32,
};

const SUGGESTION_LIMIT = 12;

/**
 * Two-tier search over an in-memory copy of all activities:
 *
 * 1. A plain case-insensitive substring match (fast, precise, what most
 *    queries should hit) — returned as `exactMatch: true`.
 * 2. Only when that finds nothing, a typo-tolerant Fuse.js fuzzy search
 *    over the same data, so a misspelling ("Delih") or a term the dataset
 *    doesn't have ("biomass") still surfaces the closest related
 *    activities instead of a dead end — returned as `exactMatch: false`.
 *
 * Rebuilt lazily after `invalidate()` (called post-sync) or on first use.
 * Trades index freshness for speed: fine at hundreds-to-low-thousands of
 * activities — the whole dataset fits comfortably in memory. Would need
 * swapping for a real search index (SQLite FTS5, Meilisearch, ...) if the
 * dataset grows far beyond that.
 */
export class FuzzySearchService {
  private activities: Activity[] | null = null;
  private index: Fuse<Activity> | null = null;

  constructor(private readonly repository: ActivityRepository) {}

  invalidate() {
    this.activities = null;
    this.index = null;
  }

  private async getActivities(): Promise<Activity[]> {
    if (!this.activities) {
      this.activities = await this.repository.listAll();
    }
    return this.activities;
  }

  private async getIndex(): Promise<Fuse<Activity>> {
    if (!this.index) {
      this.index = new Fuse(await this.getActivities(), FUSE_OPTIONS);
    }
    return this.index;
  }

  async search(query: string, limit = 60): Promise<FuzzySearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      const activities = await this.getActivities();
      return { activities: activities.slice(0, limit), exactMatch: true };
    }

    const needle = trimmed.toLowerCase();
    const activities = await this.getActivities();
    const substringMatches = activities.filter((activity) =>
      [
        activity.name,
        activity.category,
        activity.sector,
        activity.geography,
        ...activity.indicators.map((i) => i.indicatorName),
      ]
        .filter((v): v is string => Boolean(v))
        .some((field) => field.toLowerCase().includes(needle)),
    );

    if (substringMatches.length > 0) {
      return { activities: substringMatches.slice(0, limit), exactMatch: true };
    }

    const fuse = await this.getIndex();
    const suggestions = fuse.search(trimmed, { limit: SUGGESTION_LIMIT });

    return { activities: suggestions.map((r) => r.item), exactMatch: false };
  }
}
