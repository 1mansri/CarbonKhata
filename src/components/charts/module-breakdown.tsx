"use client";

import { LegendSwatch, StackedBar } from "@/components/charts/stacked-bar";
import { fmt } from "@/lib/lca/format";
import { MODULE_META } from "@/lib/lca/quality";
import { TOTAL_MODULES, type ModuleValues } from "@/lib/lca/types";

/** Total split by EN 15804 module, with module D reported beside it. */
export function ModuleBreakdown({
  modules,
  height = 28,
  compact = false,
}: {
  modules: ModuleValues;
  height?: number;
  compact?: boolean;
}) {
  const total = TOTAL_MODULES.reduce((s, m) => s + modules[m], 0);
  const segments = TOTAL_MODULES.map((m) => ({
    key: m,
    label: `${MODULE_META[m].label} ${MODULE_META[m].name}`,
    value: modules[m],
    color: MODULE_META[m].color,
  }));

  return (
    <div className="space-y-3">
      <StackedBar segments={segments} height={height} />
      <ul className={compact ? "space-y-1.5" : "grid gap-x-6 gap-y-1.5 sm:grid-cols-2"}>
        {TOTAL_MODULES.map((m) => (
          <li key={m} className="flex min-w-0 items-center gap-2 text-sm">
            <LegendSwatch color={MODULE_META[m].color} />
            <span className="w-12 shrink-0 font-mono text-xs font-medium">{MODULE_META[m].label}</span>
            <span className="truncate text-muted-foreground">{MODULE_META[m].name}</span>
            <span className="tabular ml-auto">{fmt(modules[m])}</span>
            <span className="tabular w-12 text-right text-muted-foreground">
              {total > 0 ? `${fmt((modules[m] / total) * 100, 2)}%` : "—"}
            </span>
          </li>
        ))}
        {modules.D !== 0 && (
          <li className="flex items-center gap-2 text-sm">
            <LegendSwatch className="hatch-d" />
            <span className="w-12 shrink-0 font-mono text-xs font-medium">D</span>
            <span className="truncate text-muted-foreground">Outside total</span>
            <span className="tabular ml-auto">{fmt(modules.D)}</span>
            <span className="w-12" />
          </li>
        )}
      </ul>
    </div>
  );
}
