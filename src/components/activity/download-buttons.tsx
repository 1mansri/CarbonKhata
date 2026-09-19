import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadButtons({ activityId }: { activityId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        nativeButton={false}
        render={<a href={`/api/activities/${activityId}/download?format=csv`} />}
      >
        <Download />
        Download CSV
      </Button>
      <Button
        variant="outline"
        nativeButton={false}
        render={
          <a href={`/api/activities/${activityId}/download?format=json`} />
        }
      >
        <Download />
        Download JSON
      </Button>
    </div>
  );
}
