import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Activity } from "@/lib/domain/types";

export function ActivityCard({ activity }: { activity: Activity }) {
  const previewIndicators = activity.indicators.slice(0, 3);

  return (
    <Link href={`/activity/${activity.id}`} className="block h-full">
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">
              {activity.name}
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activity.category && (
              <Badge variant="secondary">{activity.category}</Badge>
            )}
            <Badge variant="outline">{activity.sourceName}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activity.geography && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {activity.geography}
            </div>
          )}
          {previewIndicators.length > 0 && (
            <dl className="space-y-1">
              {previewIndicators.map((indicator) => (
                <div
                  key={indicator.indicatorName}
                  className="flex items-center justify-between text-sm"
                >
                  <dt className="text-muted-foreground">
                    {indicator.indicatorName}
                  </dt>
                  <dd className="font-mono tabular-nums text-foreground">
                    {indicator.value} {indicator.unit}
                  </dd>
                </div>
              ))}
              {activity.indicators.length > previewIndicators.length && (
                <p className="pt-0.5 text-xs text-muted-foreground">
                  +{activity.indicators.length - previewIndicators.length}{" "}
                  more indicators
                </p>
              )}
            </dl>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
