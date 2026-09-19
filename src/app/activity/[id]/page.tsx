import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SearchService } from "@/lib/services/search-service";
import { IndicatorTable } from "@/components/activity/indicator-table";
import { DownloadButtons } from "@/components/activity/download-buttons";

export default async function ActivityDetailPage({
  params,
}: PageProps<"/activity/[id]">) {
  const { id } = await params;
  const service = new SearchService(new PrismaActivityRepository());
  const activity = await service.getById(id);

  if (!activity) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Back to search
      </Link>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {activity.category && (
            <Badge variant="secondary">{activity.category}</Badge>
          )}
          <Badge variant="outline">{activity.sourceName}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {activity.name}
        </h1>
        {activity.geography && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {activity.geography}
            {activity.referenceYear ? ` · ${activity.referenceYear}` : ""}
          </div>
        )}
        {activity.description && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {activity.description}
          </p>
        )}
      </div>

      <DownloadButtons activityId={activity.id} />

      <IndicatorTable indicators={activity.indicators} />
    </div>
  );
}
