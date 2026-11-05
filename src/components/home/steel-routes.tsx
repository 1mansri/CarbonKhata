"use client";

import { useState } from "react";
import { MATERIALS } from "@/data/lca/materials";
import { getSource } from "@/data/lca/sources";
import { fmt } from "@/lib/lca/format";
import { cn } from "@/lib/utils";

const routes = MATERIALS.filter((m) => m.category === "Steel" && m.low != null && m.high != null).sort(
  (a, b) => a.gwp - b.gwp,
);
const average = MATERIALS.find((m) => m.id === "in-steel-avg");
const AXIS_MAX = 3200; // kg CO2 per tonne, just above the highest route

const short = (name: string) => name.replace("Crude steel, ", "").replace(" (India)", "");

/**
 * Why Indian, route-level data matters: the same tonne of steel carries
 * five times more CO2 by one route than another. Range bars from the
 * Ministry of Steel roadmap, central dot at the midpoint.
 */
export function SteelRoutes() {
  const [active, setActive] = useState(routes[routes.length - 1]?.id);
  const current = routes.find((r) => r.id === active) ?? routes[0];
  const src = current ? getSource(current.source.sourceId) : undefined;
  if (!current) return null;

  return (
    <figure className="graph-sheet relative rounded-xl border border-border bg-card p-5 sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-muted-foreground">One tonne of steel made in India</span>
        <span className="display tabular text-3xl font-semibold">
          {fmt(current.gwp / 1000, 2)}
          <span className="ml-1 text-sm font-normal text-muted-foreground [font-variation-settings:'wdth'_100]">t CO₂</span>
        </span>
      </figcaption>

      <ul className="mt-6 space-y-2.5" onPointerLeave={() => setActive(current.id)}>
        {routes.map((r, i) => {
          const isActive = r.id === current.id;
          return (
            <li key={r.id}>
              <button
                type="button"
                onPointerEnter={() => setActive(r.id)}
                onFocus={() => setActive(r.id)}
                onClick={() => setActive(r.id)}
                aria-pressed={isActive}
                className="group grid w-full grid-cols-[8.5rem_1fr] items-center gap-3 text-left sm:grid-cols-[11rem_1fr]"
              >
                <span className={cn("truncate text-sm transition-colors duration-150", isActive ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {short(r.name)}
                </span>
                <span className="relative h-5">
                  {average && (
                    <span
                      aria-hidden
                      className="absolute -top-[5px] -bottom-[5px] border-l border-dashed border-brand-accent"
                      style={{ left: `${(average.gwp / AXIS_MAX) * 100}%` }}
                    />
                  )}
                  {/* Magnitude from zero, so the 5× spread between routes reads at a glance. */}
                  <span
                    className="steel-bar absolute inset-y-[7px] left-0 rounded-r-[4px]"
                    style={{
                      width: `${(r.gwp / AXIS_MAX) * 100}%`,
                      backgroundColor: isActive
                        ? "color-mix(in oklab, var(--module-a13) 55%, transparent)"
                        : "color-mix(in oklab, var(--module-a13) 22%, transparent)",
                      animationDelay: `${120 + i * 70}ms`,
                    }}
                  />
                  {/* Published range for the route. */}
                  <span
                    className="steel-bar absolute inset-y-1 rounded-full"
                    style={{
                      left: `${(r.low! / AXIS_MAX) * 100}%`,
                      width: `${((r.high! - r.low!) / AXIS_MAX) * 100}%`,
                      backgroundColor: "var(--module-a13)",
                      opacity: isActive ? 1 : 0.55,
                      animationDelay: `${220 + i * 70}ms`,
                    }}
                  />
                  <span
                    aria-hidden
                    className="absolute top-1/2 size-2.5 rounded-full border-2 border-card transition-transform duration-150 ease-(--ease-out)"
                    style={{
                      left: `${(r.gwp / AXIS_MAX) * 100}%`,
                      backgroundColor: "var(--foreground)",
                      transform: `translate(-50%, -50%) scale(${isActive ? 1.25 : 1})`,
                    }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {average && (
        <div className="mt-2 grid grid-cols-[8.5rem_1fr] gap-3 sm:grid-cols-[11rem_1fr]">
          <span />
          <span className="relative h-6">
            <span
              className="absolute bottom-0 -translate-x-1/2 text-[11px] whitespace-nowrap text-muted-foreground"
              style={{ left: `${(average.gwp / AXIS_MAX) * 100}%` }}
            >
              India average {fmt(average.gwp / 1000, 3)}
            </span>
          </span>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Range by production route, {src?.short}, {current.source.locator}.
      </p>
    </figure>
  );
}
