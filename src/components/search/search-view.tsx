"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Loader2, SearchIcon, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityCard } from "@/components/search/activity-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Activity } from "@/lib/domain/types";
import { DATA_KIND_META, type DataKind } from "@/lib/domain/data-kind";
import { cn } from "@/lib/utils";

type KindFilter = DataKind | "all";

const SEARCH_HINTS = ["cement", "steel", "coal", "aluminum", "chemicals"];

interface SearchResponse {
  activities: Activity[];
  exactMatch: boolean;
}

async function fetchActivities(query: string): Promise<SearchResponse> {
  const url = query
    ? `/api/activities?q=${encodeURIComponent(query)}`
    : "/api/activities";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to search activities");
  return (await res.json()) as SearchResponse;
}

export function SearchView({
  initialQuery = "",
  initialActivities,
  initialExactMatch = true,
}: {
  initialQuery?: string;
  initialActivities: Activity[];
  initialExactMatch?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const debouncedQuery = useDebouncedValue(query, 150);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["activities", debouncedQuery],
    queryFn: () => fetchActivities(debouncedQuery),
    initialData:
      debouncedQuery === initialQuery
        ? { activities: initialActivities, exactMatch: initialExactMatch }
        : undefined,
    placeholderData: keepPreviousData,
  });

  const allActivities = data?.activities ?? [];
  const activities =
    kindFilter === "all"
      ? allActivities
      : allActivities.filter((a) => a.dataKind === kindFilter);
  const exactMatch = data?.exactMatch ?? true;
  const showRelatedBanner = !exactMatch && activities.length > 0;
  const showEmptyState = !isFetching && activities.length === 0;

  const kindCounts = allActivities.reduce<Partial<Record<DataKind, number>>>(
    (acc, a) => {
      if (a.dataKind) acc[a.dataKind] = (acc[a.dataKind] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const presentKinds = Object.keys(kindCounts) as DataKind[];

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try &ldquo;cement&rdquo;, &ldquo;steel&rdquo;, or &ldquo;aluminum&rdquo;"
          className="pl-9"
          aria-label="Search activities"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {presentKinds.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <FilterPill
            active={kindFilter === "all"}
            onClick={() => setKindFilter("all")}
          >
            All ({allActivities.length})
          </FilterPill>
          {presentKinds.map((kind) => (
            <FilterPill
              key={kind}
              active={kindFilter === kind}
              onClick={() => setKindFilter(kind)}
            >
              {DATA_KIND_META[kind].label} ({kindCounts[kind]})
            </FilterPill>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Something went wrong searching. Try again.
        </p>
      )}

      {showRelatedBanner && (
        <p className="rounded-lg border border-dashed border-border bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground">
          No exact match for{" "}
          <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>.
          Here&apos;s what&apos;s close.
        </p>
      )}

      {showEmptyState && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <SearchX className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No activities found{query ? ` for "${query}"` : ""}.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SEARCH_HINTS.map((hint) => (
              <button
                key={hint}
                type="button"
                onClick={() => setQuery(hint)}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isFetching && activities.length === 0 && !data
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))
          : activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}
