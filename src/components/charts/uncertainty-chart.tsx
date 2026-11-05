"use client";

import { HoverTip, useHoverTip } from "@/components/charts/hover-tip";
import { fmt } from "@/lib/lca/format";
import type { UncertaintyResult } from "@/lib/lca/uncertainty";

const W = 640;
const H = 180;
const PAD = { top: 12, right: 8, bottom: 28, left: 8 };
const BINS = 36;

/** Histogram of Monte Carlo totals with the 95% interval and the point estimate. */
export function UncertaintyChart({
  result,
  deterministic,
}: {
  result: UncertaintyResult;
  deterministic: number;
}) {
  const { ref, tip, bind } = useHoverTip<{ from: number; to: number; count: number }>();
  const min = Math.min(...result.samples, deterministic);
  const max = Math.max(...result.samples, deterministic);
  const span = max - min || 1;
  const counts = new Array<number>(BINS).fill(0);
  for (const s of result.samples) counts[Math.min(BINS - 1, Math.floor(((s - min) / span) * BINS))]++;
  const peak = Math.max(...counts);

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (v: number) => PAD.left + ((v - min) / span) * plotW;
  const binW = plotW / BINS;

  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Monte Carlo distribution of the total: 95% interval ${fmt(result.p2_5)} to ${fmt(result.p97_5)} kg CO₂e`}>
        {/* 95% interval as a bracket under the bars. */}
        <g stroke="var(--brand-accent)" strokeWidth={2}>
          <line x1={x(result.p2_5)} x2={x(result.p97_5)} y1={PAD.top + plotH + 7} y2={PAD.top + plotH + 7} />
          <line x1={x(result.p2_5)} x2={x(result.p2_5)} y1={PAD.top + plotH + 3} y2={PAD.top + plotH + 11} />
          <line x1={x(result.p97_5)} x2={x(result.p97_5)} y1={PAD.top + plotH + 3} y2={PAD.top + plotH + 11} />
        </g>
        {counts.map((c, i) => {
          const h = peak > 0 ? (c / peak) * plotH : 0;
          const from = min + (i / BINS) * span;
          return (
            <g key={i} {...bind({ from, to: from + span / BINS, count: c })}>
              <rect x={PAD.left + i * binW} y={PAD.top} width={binW} height={plotH} fill="transparent" />
              <rect
                x={PAD.left + i * binW + 1}
                y={PAD.top + plotH - h}
                width={Math.max(binW - 2, 1)}
                height={h}
                rx={2}
                fill="var(--module-a13)"
                opacity={0.85}
              />
            </g>
          );
        })}
        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} stroke="var(--border)" />
        <line
          x1={x(deterministic)}
          x2={x(deterministic)}
          y1={PAD.top - 4}
          y2={PAD.top + plotH}
          stroke="var(--foreground)"
          strokeWidth={2}
        />
        {(result.p97_5 > result.p2_5
          ? [
              { v: result.p2_5, anchor: "end" as const, dx: -4 },
              { v: result.p97_5, anchor: "start" as const, dx: 4 },
            ]
          : [{ v: result.p2_5, anchor: "middle" as const, dx: 0 }]
        ).map(({ v, anchor, dx }) => (
          <text
            key={anchor}
            x={x(v) + dx}
            y={H - 8}
            textAnchor={anchor}
            className="tabular fill-muted-foreground text-[11px]"
          >
            {fmt(v, 3)}
          </text>
        ))}
      </svg>
      <HoverTip tip={tip}>
        {tip && (
          <>
            <div className="tabular font-medium">
              {fmt(tip.data.from, 3)} – {fmt(tip.data.to, 3)} kg CO₂e
            </div>
            <div className="tabular text-muted-foreground">{tip.data.count} of {result.runs} runs</div>
          </>
        )}
      </HoverTip>
    </div>
  );
}
