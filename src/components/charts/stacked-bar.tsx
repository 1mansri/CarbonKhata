"use client";

import { HoverTip, useHoverTip } from "@/components/charts/hover-tip";
import { fmt } from "@/lib/lca/format";
import { cn } from "@/lib/utils";

export interface Segment {
  key: string;
  label: string;
  value: number;
  /** CSS colour, or omit and pass `className` for a texture fill. */
  color?: string;
  className?: string;
}

/**
 * One horizontal stacked bar. Segments are full-width layers scaled from
 * the left and shifted into place, so value changes animate with transform
 * only (no layout). Separators are 2px surface-coloured gaps that are moved,
 * never scaled, so they stay crisp.
 */
export function StackedBar({
  segments,
  max,
  height = 28,
  unit = "kg CO₂e",
  className,
}: {
  segments: Segment[];
  /** Value that maps to the full width (defaults to the bar's own sum). */
  max?: number;
  height?: number;
  unit?: string;
  className?: string;
}) {
  const { ref, tip, bind } = useHoverTip<Segment & { share: number }>();
  const positive = segments.filter((s) => s.value > 0);
  const sum = positive.reduce((s, seg) => s + seg.value, 0);
  const scale = max && max > 0 ? max : sum;

  const shares = positive.map((seg) => (scale > 0 ? seg.value / scale : 0));
  const placed = positive.map((seg, i) => ({
    seg,
    share: shares[i],
    start: shares.slice(0, i).reduce((a, b) => a + b, 0),
  }));

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div
        className="relative w-full overflow-hidden rounded-[4px] bg-muted"
        style={{ height }}
        role="img"
        aria-label={placed.map(({ seg }) => `${seg.label}: ${fmt(seg.value)} ${unit}`).join("; ")}
      >
        {placed.map(({ seg, share, start }) => (
          <div
            key={seg.key}
            className={cn(
              "absolute inset-0 origin-left transition-transform duration-[240ms] ease-(--ease-out) motion-reduce:transition-none",
              seg.className,
            )}
            style={{
              backgroundColor: seg.color,
              transform: `translateX(${start * 100}%) scaleX(${share})`,
            }}
            {...bind({ ...seg, share: sum > 0 ? seg.value / sum : 0 })}
          />
        ))}
        {placed.slice(1).map(({ seg, start }) => (
          <div
            key={`gap-${seg.key}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-transform duration-[240ms] ease-(--ease-out) motion-reduce:transition-none"
            style={{ transform: `translateX(${start * 100}%)` }}
          >
            <div className="absolute inset-y-0 -left-px w-[2px] bg-card" />
          </div>
        ))}
      </div>
      <HoverTip tip={tip}>
        {tip && (
          <>
            <div className="font-medium">{tip.data.label}</div>
            <div className="tabular text-muted-foreground">
              {fmt(tip.data.value)} {unit} ({fmt(tip.data.share * 100, 3)}%)
            </div>
          </>
        )}
      </HoverTip>
    </div>
  );
}

export function LegendSwatch({ color, className }: { color?: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-[2px]", className)}
      style={{ backgroundColor: color }}
    />
  );
}
