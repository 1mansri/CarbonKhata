import { fuzzySearchService } from "@/lib/services/fuzzy-search-singleton";
import { SearchService } from "@/lib/services/search-service";
import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SearchView } from "@/components/search/search-view";
import { BulletList } from "@/components/shared/bullet-list";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q : Array.isArray(params.q) ? params.q[0] : "";

  const [initial, sources] = await Promise.all([
    fuzzySearchService.search(query, 60),
    new SearchService(new PrismaActivityRepository()).listSources(),
  ]);
  const totalActivities = sources.reduce((sum, s) => sum + s.activityCount, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-3">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Search live emission data for cement, steel, coal, and air quality
          across India
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Pulled live from CPCB and Climate TRACE. No ecoinvent license, no
          signup, no paywall.
        </p>
        {totalActivities > 0 && (
          <p className="font-mono text-xs text-muted-foreground">
            {totalActivities.toLocaleString()} live records tracked right
            now &middot; see{" "}
            <a href="/sources" className="underline underline-offset-2 hover:text-primary">
              exactly where they come from
            </a>
          </p>
        )}
      </div>
      <SearchView
        initialQuery={query}
        initialActivities={initial.activities}
        initialExactMatch={initial.exactMatch}
      />
      <div className="max-w-xl space-y-2 border-t border-border pt-8">
        <h2 className="text-sm font-medium text-foreground">Before you search</h2>
        <BulletList
          items={[
            "Not ecoinvent. This is free public data, not a licensed LCA database.",
            "Each activity carries one indicator (CO2e or a pollutant), not a full LCIA.",
            "Coverage is India-focused, across major industrial sectors and CPCB monitoring.",
          ]}
        />
      </div>
    </div>
  );
}
