"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { NumberInput } from "@/components/ui/number-input";
import { QualityBadge } from "@/components/project/quality-badge";
import { SITE_FACTORS } from "@/data/lca/site";
import { fmt } from "@/lib/lca/format";
import { newId } from "@/lib/lca/project";
import { unitLabel } from "@/lib/lca/units";
import type { Project, ProjectResult } from "@/lib/lca/types";

export function SiteEnergy({
  project,
  result,
  update,
}: {
  project: Project;
  result: ProjectResult;
  update: (change: (p: Project) => Project) => void;
}) {
  if (!project.scope.boundary.a5) return null;

  return (
    <section className="@container space-y-3">
      <h2 className="text-base font-semibold">
        Site energy and water <span className="font-mono text-xs font-medium text-muted-foreground">A5</span>
      </h2>
      {project.siteEnergy.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {project.siteEnergy.map((e) => {
            const r = result.siteEnergy.find((s) => s.itemId === e.id);
            return (
              <li
                key={e.id}
                className="grid grid-cols-[minmax(0,1fr)_6.5rem_2rem] items-center gap-x-3 gap-y-2 px-3 py-2.5 @xl:grid-cols-[minmax(0,1fr)_7.5rem_6.5rem_2rem]"
              >
                <span className="col-span-3 flex min-w-0 flex-wrap items-center gap-2 @xl:col-span-1">
                  <NativeSelect
                    aria-label="Energy or water source"
                    className="min-w-0 max-w-full"
                    value={e.factor.id}
                    onChange={(ev) => {
                      const factor = SITE_FACTORS.find((f) => f.id === ev.target.value)!;
                      update((p) => ({
                        ...p,
                        siteEnergy: p.siteEnergy.map((x) => (x.id === e.id ? { ...x, factor } : x)),
                      }));
                    }}
                  >
                    {SITE_FACTORS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </NativeSelect>
                  <QualityBadge quality={e.factor.quality} />
                </span>
                <span className="flex items-center gap-1.5">
                  <NumberInput
                    aria-label={`Quantity in ${unitLabel(e.factor.unit)}`}
                    value={e.quantity}
                    onChange={(q) =>
                      q != null &&
                      update((p) => ({
                        ...p,
                        siteEnergy: p.siteEnergy.map((x) => (x.id === e.id ? { ...x, quantity: q } : x)),
                      }))
                    }
                  />
                  <span className="w-8 font-mono text-2xs text-muted-foreground">{unitLabel(e.factor.unit)}</span>
                </span>
                <span className="tabular text-right text-sm font-medium" title={r?.working}>
                  {fmt(r?.value ?? 0)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove"
                  onClick={() => update((p) => ({ ...p, siteEnergy: p.siteEnergy.filter((x) => x.id !== e.id) }))}
                >
                  <Trash2 />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          update((p) => ({ ...p, siteEnergy: [...p.siteEnergy, { id: newId(), quantity: 0, factor: SITE_FACTORS[0] }] }))
        }
      >
        <Plus />
        Add electricity, diesel or water
      </Button>
    </section>
  );
}
