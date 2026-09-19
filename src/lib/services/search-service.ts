import type {
  ActivityRepository,
  ActivitySearchParams,
} from "@/lib/domain/activity-repository";

/**
 * Thin wrapper around the repository for now, but this is where
 * search-specific business logic (ranking, filters, facets) grows without
 * API routes or the repository needing to change.
 */
export class SearchService {
  constructor(private readonly repository: ActivityRepository) {}

  search(params: ActivitySearchParams) {
    return this.repository.search(params);
  }

  getById(id: string) {
    return this.repository.findById(id);
  }

  listSources() {
    return this.repository.listSources();
  }
}
