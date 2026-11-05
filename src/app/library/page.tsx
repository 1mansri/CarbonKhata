import { fuzzySearchService } from "@/lib/services/fuzzy-search-singleton";
import { SearchView } from "@/components/search/search-view";
import { CuratedLibrary } from "@/components/library/curated-library";
import { LibraryTabs } from "@/components/library/library-tabs";

export const metadata = { title: "Library" };

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : Array.isArray(params.q) ? params.q[0] : "";
  const initial = await fuzzySearchService.search(query, 60);

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-2xl space-y-2">
        <h1 className="display text-3xl font-semibold">Library</h1>
        <p className="text-muted-foreground">
          Every factor with its source, page and licence. Indian data first; proxies are marked.
        </p>
      </div>
      <LibraryTabs
        curated={<CuratedLibrary />}
        live={
          <SearchView
            initialQuery={query}
            initialActivities={initial.activities}
            initialExactMatch={initial.exactMatch}
          />
        }
      />
    </div>
  );
}
