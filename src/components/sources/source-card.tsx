import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataSourceSummary } from "@/lib/domain/types";
import { SyncButton } from "@/components/sources/sync-button";
import { SYNC_ENDPOINTS } from "@/lib/sources/sync-endpoints";
import { DataKindBadge } from "@/components/shared/data-kind-badge";

const FETCH_MODE_LABEL: Record<DataSourceSummary["fetchMode"], string> = {
  live: "Live",
  "periodic-import": "Periodic import",
  "user-upload": "User upload",
};

export function SourceCard({ source }: { source: DataSourceSummary }) {
  const syncEndpoint = SYNC_ENDPOINTS[source.name];

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-base">{source.name}</CardTitle>
          <div className="flex gap-1.5">
            <DataKindBadge dataKind={source.dataKind} />
            <Badge variant={source.fetchMode === "live" ? "default" : "secondary"}>
              {FETCH_MODE_LABEL[source.fetchMode]}
            </Badge>
          </div>
        </div>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-xs text-muted-foreground underline underline-offset-2 hover:text-primary"
          >
            {source.url}
          </a>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          {source.licenseNote && (
            <p className="max-w-lg text-sm text-muted-foreground">
              {source.licenseNote}
            </p>
          )}
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <div className="flex gap-1.5">
              <dt>Activities:</dt>
              <dd className="font-mono text-foreground">
                {source.activityCount}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt>Last synced:</dt>
              <dd className="font-mono text-foreground">
                {source.lastSyncedAt
                  ? new Date(source.lastSyncedAt).toLocaleString()
                  : "never"}
              </dd>
            </div>
          </dl>
        </div>
        {syncEndpoint && <SyncButton endpoint={syncEndpoint} label="Refresh data" />}
      </CardContent>
    </Card>
  );
}
