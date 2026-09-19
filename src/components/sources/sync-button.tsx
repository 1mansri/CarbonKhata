"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

async function triggerSync(): Promise<{ activityCount: number }> {
  const res = await fetch("/api/sync/cpcb", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Sync failed");
  return data;
}

export function SyncButton() {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: triggerSync,
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        size="sm"
        variant="outline"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <RefreshCw />
        )}
        Refresh CPCB data
      </Button>
      {mutation.isError && (
        <p className="max-w-xs text-right text-xs text-destructive">
          {mutation.error.message}
        </p>
      )}
      {mutation.isSuccess && (
        <p className="text-xs text-muted-foreground">
          Synced {mutation.data.activityCount} activities.
        </p>
      )}
    </div>
  );
}
