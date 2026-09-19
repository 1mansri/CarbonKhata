import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { FuzzySearchService } from "@/lib/services/fuzzy-search-service";

declare global {
  var fuzzySearchServiceInstance: FuzzySearchService | undefined;
}

export const fuzzySearchService =
  globalThis.fuzzySearchServiceInstance ??
  new FuzzySearchService(new PrismaActivityRepository());

if (process.env.NODE_ENV !== "production") {
  globalThis.fuzzySearchServiceInstance = fuzzySearchService;
}
