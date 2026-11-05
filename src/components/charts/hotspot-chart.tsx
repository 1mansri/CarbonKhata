"use client";

import { StackedBar } from "@/components/charts/stacked-bar";
import { fmt } from "@/lib/lca/format";
import { MODULE_META } from "@/lib/lca/quality";
import { TOTAL_MODULES, type ItemResult } from "@/lib/lca/types";

/**
 * Which inventory lines drive the total, largest first. Each bar is split
 * by module so you can see whether a hotspot is production or transport.
 */
export function HotspotChart({ items, limit }: { items: ItemResult[]; limit?: number }) {
  const total = items.reduce((s, i) => s + i.total, 0);
  const sorted = [...items].filter((i) => i.total > 0).sort((a, b) => b.total - a.total);
  const shown = limit ? sorted.slice(0, limit) : sorted;
  const max = shown[0]?.total ?? 0;

  if (shown.length === 0) return null;

  return (
    <ol className="space-y-2.5">
      {shown.map((item) => (
        <li key={item.itemId} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 sm:grid-cols-[minmax(0,14rem)_1fr_auto]">
          <span className="truncate text-sm" title={item.label}>
            {item.label}
          </span>
          <StackedBar
            height={14}
            max={max}
            segments={TOTAL_MODULES.map((m) => ({
              key: m,
              label: `${MODULE_META[m].label} ${MODULE_META[m].name}`,
              value: item.modules[m],
              color: MODULE_META[m].color,
            }))}
          />
          <span className="tabular w-24 text-right text-sm">
            {fmt(item.total, 3)}
            <span className="ml-1.5 text-xs text-muted-foreground">
              {total > 0 ? `${fmt((item.total / total) * 100, 2)}%` : ""}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
