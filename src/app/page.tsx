import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SearchService } from "@/lib/services/search-service";
import { SearchView } from "@/components/search/search-view";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q : Array.isArray(params.q) ? params.q[0] : "";

  const service = new SearchService(new PrismaActivityRepository());
  const initialActivities = await service.search({ query: query || undefined, limit: 60 });

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Search activity data for LCA
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Search live CPCB monitoring data and other LCA-relevant sources,
          then download what you find.
        </p>
      </div>
      <SearchView initialQuery={query} initialActivities={initialActivities} />
    </div>
  );
}
