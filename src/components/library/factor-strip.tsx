"use client";

import { HoverTip, useHoverTip } from "@/components/charts/hover-tip";
import { fmt } from "@/lib/lca/format";
import type { MaterialFactor } from "@/lib/lca/types";

/** kg CO2e per kg of product, when the factor's mass is known. */
export function perKg(m: MaterialFactor): number | null {
  if (m.declaredUnit === "kg") return m.gwp;
  if (m.declaredUnit === "t") return m.gwp / 1000;
  return m.massPerUnitKg ? m.gwp / m.massPerUnitKg : null;
}

const LANES = [
  { key: "epd", label: "Manufacturer EPDs", test: (m: MaterialFactor) => m.quality === "india-epd" },
  { key: "generic", label: "Generic and national", test: (m: MaterialFactor) => m.quality !== "india-epd" },
] as const;

/**
 * Where each Indian value sits, per kg of material. Two lanes put product
 * EPDs beside generic and national figures, so the spread between brands —
 * and how generic values compare — is visible at a glance.
 */
export function FactorStrip({ materials }: { materials: MaterialFactor[] }) {
  const { ref, tip, bind } = useHoverTip<{ name: string; value: number }>();
  const points = materials
    .map((m) => ({ m, v: perKg(m) }))
    .filter((p): p is { m: MaterialFactor; v: number } => p.v != null && p.v > 0);
  if (points.length < 2) return null;
  const max = Math.max(...points.map((p) => p.v)) * 1.05;

  return (
    <div ref={ref} className="relative rounded-lg border border-border bg-card px-4 pt-3 pb-2">
      {LANES.map((lane) => {
        const lanePoints = points.filter((p) => lane.test(p.m));
        return (
          <div key={lane.key} className="grid grid-cols-[9rem_1fr] items-center gap-3 py-1.5">
            <span className="text-xs text-muted-foreground">{lane.label}</span>
            <div className="relative h-5 border-l border-border">
              <div aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-border" />
              {lanePoints.map(({ m, v }) => (
                <span
                  key={m.id}
                  {...bind({ name: m.name, value: v })}
                  className={
                    lane.key === "epd"
                      ? "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-module-a13 transition-transform duration-150 ease-(--ease-out) hover:scale-150"
                      : "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground/70 bg-card transition-transform duration-150 ease-(--ease-out) hover:scale-150"
                  }
                  style={{ left: `${(v / max) * 100}%` }}
                />
              ))}
            </div>
          </div>
        );
      })}
      <div className="grid grid-cols-[9rem_1fr] gap-3">
        <span />
        <div className="tabular flex justify-between text-[11px] text-muted-foreground">
          <span>0</span>
          <span>{fmt(max, 2)} kg CO₂e per kg</span>
        </div>
      </div>
      <HoverTip tip={tip}>
        {tip && (
          <>
            <div className="font-medium">{tip.data.name}</div>
            <div className="tabular text-muted-foreground">{fmt(tip.data.value, 3)} kg CO₂e/kg</div>
          </>
        )}
      </HoverTip>
    </div>
  );
}
