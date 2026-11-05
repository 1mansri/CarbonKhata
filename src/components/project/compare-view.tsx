"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegendSwatch, StackedBar } from "@/components/charts/stacked-bar";
import { calculateProject } from "@/lib/lca/calculate";
import { fmt } from "@/lib/lca/format";
import { cloneProject } from "@/lib/lca/project";
import { saveProject, useProjects } from "@/lib/lca/project-store";
import { MODULE_META } from "@/lib/lca/quality";
import { TOTAL_MODULES, type Project } from "@/lib/lca/types";

/** Alternatives side by side on one scale, e.g. OPC vs PPC vs geopolymer. */
export function CompareView({ project }: { project: Project }) {
  const all = useProjects();
  const others = useMemo(
    () => Object.values(all ?? {}).filter((p) => p.id !== project.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [all, project.id],
  );
  const [picked, setPicked] = useState<string[]>([]);
  const rows = [project, ...others.filter((p) => picked.includes(p.id))].map((p) => ({
    project: p,
    result: calculateProject(p),
  }));
  const max = Math.max(...rows.map((r) => r.result.total), 0);
  const base = rows[0].result.total;
  const units = new Set(rows.map((r) => r.project.scope.functionalUnit.trim().toLowerCase()));

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <div className="space-y-3">
        <p className="text-sm font-medium">Compare with</p>
        {others.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other projects yet.</p>
        ) : (
          <ul className="space-y-1">
            {others.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    className="size-4 accent-(--primary)"
                    checked={picked.includes(p.id)}
                    onChange={(e) =>
                      setPicked((cur) => (e.target.checked ? [...cur, p.id] : cur.filter((id) => id !== p.id)))
                    }
                  />
                  <span className="truncate">{p.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const copy = cloneProject(project, `${project.name} (alternative)`);
            saveProject(copy);
            setPicked((cur) => [...cur, copy.id]);
          }}
        >
          <Copy />
          Duplicate as an alternative
        </Button>
      </div>

      <div className="space-y-5">
        {units.size > 1 && (
          <p className="rounded-md border border-dashed border-warning/60 px-3 py-2 text-sm text-warning">
            These projects use different functional units, so their totals aren&apos;t directly comparable.
          </p>
        )}
        <ol className="space-y-4">
          {rows.map(({ project: p, result }, i) => (
            <li key={p.id} className="grid gap-1.5">
              <div className="flex items-baseline gap-3 text-sm">
                {i === 0 ? (
                  <span className="font-medium">{p.name}</span>
                ) : (
                  <Link href={`/project/${p.id}`} className="font-medium hover:text-primary">
                    {p.name}
                  </Link>
                )}
                <span className="text-xs text-muted-foreground">{p.scope.functionalUnit}</span>
                <span className="tabular ml-auto">{fmt(result.total)} kg CO₂e</span>
                <span className="tabular w-16 text-right text-xs text-muted-foreground">
                  {i === 0 ? "baseline" : base > 0 ? `${result.total >= base ? "+" : "−"}${fmt((Math.abs(result.total - base) / base) * 100, 2)}%` : ""}
                </span>
              </div>
              <StackedBar
                max={max}
                height={22}
                segments={TOTAL_MODULES.map((m) => ({
                  key: m,
                  label: `${MODULE_META[m].label} ${MODULE_META[m].name}`,
                  value: result.modules[m],
                  color: MODULE_META[m].color,
                }))}
              />
            </li>
          ))}
        </ol>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          {TOTAL_MODULES.map((m) => (
            <li key={m} className="flex items-center gap-1.5">
              <LegendSwatch color={MODULE_META[m].color} />
              {MODULE_META[m].label} {MODULE_META[m].name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
