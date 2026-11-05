"use client";

import { ModuleBreakdown } from "@/components/charts/module-breakdown";
import { HotspotChart } from "@/components/charts/hotspot-chart";
import { fmt, fmtCarbon } from "@/lib/lca/format";
import type { Project, ProjectResult } from "@/lib/lca/types";

/** The ledger's running balance: always visible while you edit. */
export function LiveTotal({ project, result }: { project: Project; result: ProjectResult }) {
  const total = fmtCarbon(result.total);

  return (
    <aside className="space-y-5 rounded-lg border border-border bg-card p-5" aria-live="polite">
      <div>
        <p className="text-xs text-muted-foreground">
          Total, {project.scope.functionalUnit ? `per ${project.scope.functionalUnit}` : "whole inventory"}
        </p>
        <p className="display tabular text-4xl font-semibold leading-tight">
          {total.value}
          <span className="ml-1.5 text-base font-normal text-muted-foreground [font-variation-settings:'wdth'_100]">
            {total.unit}
          </span>
        </p>
        {result.perFloorArea != null && (
          <p className="tabular text-sm text-muted-foreground">{fmt(result.perFloorArea, 3)} kg CO₂e/m²</p>
        )}
      </div>
      <ModuleBreakdown modules={result.modules} compact />
      {result.items.length > 1 && (
        <div className="space-y-2">
          <p className="condensed text-xs font-semibold text-muted-foreground">Hotspots</p>
          <HotspotChart items={result.items} limit={3} />
        </div>
      )}
      {result.warnings.length > 0 && (
        <p className="text-xs font-medium text-warning">
          {result.warnings.length} line{result.warnings.length > 1 ? "s need" : " needs"} attention
        </p>
      )}
    </aside>
  );
}
