"use client";

import { useRef, useState } from "react";

interface TipState<T> {
  x: number;
  y: number;
  data: T;
}

/**
 * Pointer-following tooltip for chart marks. Attach `ref` to the chart's
 * relative container and spread `bind(data)` on each mark.
 */
export function useHoverTip<T>() {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState<T> | null>(null);

  const bind = (data: T) => ({
    onPointerMove: (e: React.PointerEvent) => {
      const box = ref.current?.getBoundingClientRect();
      if (box) setTip({ x: e.clientX - box.left, y: e.clientY - box.top, data });
    },
    onPointerLeave: () => setTip(null),
  });

  return { ref, tip, bind };
}

export function HoverTip({
  tip,
  children,
}: {
  tip: { x: number; y: number } | null;
  children: React.ReactNode;
}) {
  if (!tip) return null;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 min-w-36 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
      style={{ left: tip.x, top: tip.y, transform: "translate(-50%, calc(-100% - 12px))" }}
    >
      {children}
    </div>
  );
}
