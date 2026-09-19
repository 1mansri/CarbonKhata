"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityCard } from "@/components/search/activity-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Activity } from "@/lib/domain/types";

async function fetchActivities(query: string): Promise<Activity[]> {
  const url = query
    ? `/api/activities?q=${encodeURIComponent(query)}`
    : "/api/activities";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to search activities");
  const data = (await res.json()) as { activities: Activity[] };
  return data.activities;
}

export function SearchView({
  initialQuery = "",
  initialActivities,
}: {
  initialQuery?: string;
  initialActivities: Activity[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["activities", debouncedQuery],
    queryFn: () => fetchActivities(debouncedQuery),
    initialData: debouncedQuery === initialQuery ? initialActivities : undefined,
  });

  const activities = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search an activity, e.g. &ldquo;air quality Delhi&rdquo;"
          className="pl-9"
          aria-label="Search activities"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          Something went wrong searching. Try again.
        </p>
      )}

      {!isError && activities.length === 0 && !isFetching && (
        <p className="text-sm text-muted-foreground">
          No activities found{query ? ` for "${query}"` : ""}.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isFetching && activities.length === 0
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
