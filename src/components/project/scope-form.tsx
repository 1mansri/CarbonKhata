"use client";

import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { BoundaryDiagram } from "@/components/charts/boundary-diagram";
import type { Project, ProjectScope } from "@/lib/lca/types";

/** ISO 14044 goal and scope, kept to the fields a report actually needs. */
export function ScopeForm({
  project,
  update,
}: {
  project: Project;
  update: (change: (p: Project) => Project) => void;
}) {
  const setScope = (patch: Partial<ProjectScope>) =>
    update((p) => ({ ...p, scope: { ...p.scope, ...patch } }));
  const { scope } = project;

  return (
    <div className="max-w-3xl space-y-8">
      <section className="space-y-3">
        <h2 className="text-heading font-semibold">System boundary</h2>
        <BoundaryDiagram boundary={scope.boundary} onChange={(boundary) => setScope({ boundary })} />
        <p className="text-xs text-muted-foreground">
          Tap a module to include it or leave it out. The use stage (B1–B7) isn&apos;t covered. D is shown beside the
          total, never added to it.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm sm:col-span-2">
          <span className="font-medium">Functional unit</span>
          <Input
            value={scope.functionalUnit}
            onChange={(e) => setScope({ functionalUnit: e.target.value })}
            placeholder="1 m³ of M30 concrete"
          />
        </label>
        <label className="space-y-1.5 text-sm sm:col-span-2">
          <span className="font-medium">Goal</span>
          <textarea
            value={scope.goal}
            onChange={(e) => setScope({ goal: e.target.value })}
            rows={3}
            placeholder="Compare the cradle-to-gate carbon of OPC and fly-ash concrete for a thesis chapter."
            className="w-full rounded-md border border-input bg-card px-2.5 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:text-sm"
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Gross floor area (optional)</span>
          <span className="flex items-center gap-2">
            <NumberInput value={scope.floorAreaM2} onChange={(v) => setScope({ floorAreaM2: v })} placeholder="0" className="max-w-40" />
            <span className="text-xs text-muted-foreground">m²</span>
          </span>
        </label>
        <label className="space-y-1.5 text-sm sm:col-span-2">
          <span className="font-medium">Assumptions and cut-offs</span>
          <textarea
            value={scope.assumptions ?? ""}
            onChange={(e) => setScope({ assumptions: e.target.value })}
            rows={3}
            placeholder="Fly ash and GGBS enter burden-free (cut-off). Formwork excluded."
            className="w-full rounded-md border border-input bg-card px-2.5 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:text-sm"
          />
        </label>
      </section>
    </div>
  );
}
