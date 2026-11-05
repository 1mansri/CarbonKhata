"use client";

import { Lock } from "lucide-react";
import { MODULE_META } from "@/lib/lca/quality";
import type { ProjectScope } from "@/lib/lca/types";
import { cn } from "@/lib/utils";

type Boundary = ProjectScope["boundary"];

const STAGES: {
  id: string;
  label: string;
  name: string;
  color?: string;
  key?: keyof Boundary;
  locked?: "in" | "out";
}[] = [
  { id: "A1-A3", label: "A1–A3", name: "Product", color: MODULE_META["A1-A3"].color, locked: "in" },
  { id: "A4", label: "A4", name: "Transport", color: MODULE_META.A4.color, key: "a4" },
  { id: "A5", label: "A5", name: "Construction", color: MODULE_META.A5.color, key: "a5" },
  { id: "B", label: "B1–B7", name: "Use", locked: "out" },
  { id: "C", label: "C1–C4", name: "End of life", color: MODULE_META["C1-C4"].color, key: "c" },
];

/**
 * The EN 15804 life cycle as a strip you can switch modules on and off in.
 * The diagram *is* the control: what's filled is inside the boundary.
 */
export function BoundaryDiagram({
  boundary,
  onChange,
}: {
  boundary: Boundary;
  onChange?: (next: Boundary) => void;
}) {
  const toggle = (key: keyof Boundary) => onChange?.({ ...boundary, [key]: !boundary[key] });

  return (
    <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
      {STAGES.map((stage) => {
        const included = stage.locked === "in" || (stage.key ? boundary[stage.key] : false);
        const interactive = !!stage.key && !!onChange;
        return (
          <button
            key={stage.id}
            type="button"
            disabled={!interactive}
            aria-pressed={stage.key ? included : undefined}
            onClick={() => stage.key && toggle(stage.key)}
            className={cn(
              "group relative flex min-w-24 flex-1 flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-150 ease-(--ease-out)",
              interactive && "active:scale-[0.97] motion-reduce:active:scale-100",
              stage.locked === "out"
                ? "border-dashed border-border bg-[repeating-linear-gradient(135deg,var(--grid-major)_0_1px,transparent_1px_7px)] text-muted-foreground"
                : included
                  ? "border-transparent text-foreground"
                  : "border-dashed border-input text-muted-foreground hover:border-foreground/40",
            )}
            style={
              included && stage.color
                ? { backgroundColor: `color-mix(in oklab, ${stage.color} 16%, transparent)` }
                : undefined
            }
          >
            {included && stage.color && (
              <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-r" style={{ backgroundColor: stage.color }} />
            )}
            <span className="condensed text-sm font-semibold">{stage.label}</span>
            <span className="text-xs">{stage.name}</span>
            {stage.locked && <Lock aria-hidden className="absolute top-2 right-2 size-3 opacity-50" />}
          </button>
        );
      })}
      <div aria-hidden className="mx-1 w-px self-stretch border-l border-dashed border-foreground/40" />
      <button
        type="button"
        disabled={!onChange}
        aria-pressed={boundary.d}
        onClick={() => toggle("d")}
        className={cn(
          "relative flex min-w-24 flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left transition-[background-color,border-color,transform] duration-150 ease-(--ease-out)",
          onChange && "active:scale-[0.97] motion-reduce:active:scale-100",
          boundary.d ? "hatch-d border-transparent text-foreground" : "border-dashed border-input text-muted-foreground",
        )}
      >
        <span className="condensed rounded-sm bg-card/90 px-1 text-sm font-semibold">D</span>
        <span className="rounded-sm bg-card/90 px-1 text-xs">Beyond</span>
      </button>
    </div>
  );
}
