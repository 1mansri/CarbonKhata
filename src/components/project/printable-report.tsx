"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportDocument } from "@/components/project/report-document";
import { useProject } from "@/lib/lca/project-store";

export function PrintableReport({ id }: { id: string }) {
  const project = useProject(id);

  if (project === undefined) return <Skeleton className="mx-auto h-96 w-full max-w-3xl" />;
  if (project === null) return <p className="text-sm text-muted-foreground">This project isn&apos;t in this browser.</p>;

  return (
    <div className="space-y-6">
      <div className="mx-auto flex max-w-3xl justify-end print:hidden">
        <Button onClick={() => window.print()}>
          <Printer />
          Print or save as PDF
        </Button>
      </div>
      <ReportDocument project={project} />
    </div>
  );
}
