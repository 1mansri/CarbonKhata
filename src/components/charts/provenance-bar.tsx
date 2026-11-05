"use client";

import { LegendSwatch, StackedBar } from "@/components/charts/stacked-bar";
import { fmt } from "@/lib/lca/format";
import { QUALITY_META } from "@/lib/lca/quality";
import type { DataQuality } from "@/lib/lca/types";

/**
 * Monochrome on purpose: provenance must never be confused with the module
 * colours. Indian data is solid ink, proxies are hatched, your own data is
 * a light fill.
 */
const STYLE: Record<"india" | "ipcc" | "proxy" | "user", { label: string; color?: string; className?: string }> = {
  india: { label: "Indian data", color: "var(--foreground)" },
  ipcc: { label: "IPCC default", color: "var(--muted-foreground)" },
  proxy: {
    label: "International proxy",
    className:
      "bg-[repeating-linear-gradient(135deg,var(--muted-foreground)_0_2px,transparent_2px_6px)]",
  },
  user: { label: "Your data", color: "var(--input)" },
};

function group(q: DataQuality): keyof typeof STYLE {
  if (QUALITY_META[q].india) return "india";
  if (q === "ipcc-default") return "ipcc";
  if (q === "user") return "user";
  return "proxy";
}

export function ProvenanceBar({ shares }: { shares: Map<DataQuality, number> }) {
  const grouped = new Map<keyof typeof STYLE, number>();
  for (const [q, kg] of shares) grouped.set(group(q), (grouped.get(group(q)) ?? 0) + kg);
  const total = [...grouped.values()].reduce((s, v) => s + v, 0);
  const india = grouped.get("india") ?? 0;
  const keys = (Object.keys(STYLE) as (keyof typeof STYLE)[]).filter((k) => (grouped.get(k) ?? 0) > 0);

  if (total <= 0) return null;

  return (
    <div className="space-y-3">
      <p className="display text-3xl font-semibold tabular">
        {fmt((india / total) * 100, 3)}%
        <span className="ml-2 align-middle text-sm font-normal text-muted-foreground [font-variation-settings:'wdth'_100]">
          of this total rests on Indian data
        </span>
      </p>
      <StackedBar
        height={14}
        segments={keys.map((k) => ({
          key: k,
          label: STYLE[k].label,
          value: grouped.get(k) ?? 0,
          color: STYLE[k].color,
          className: STYLE[k].className,
        }))}
      />
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {keys.map((k) => (
          <li key={k} className="flex items-center gap-2">
            <LegendSwatch color={STYLE[k].color} className={STYLE[k].className} />
            <span className="text-muted-foreground">{STYLE[k].label}</span>
            <span className="tabular">{fmt(((grouped.get(k) ?? 0) / total) * 100, 2)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
