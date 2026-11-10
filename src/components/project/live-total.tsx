"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { ModuleBreakdown } from "@/components/charts/module-breakdown";
import { HotspotChart } from "@/components/charts/hotspot-chart";
import { StackedBar } from "@/components/charts/stacked-bar";
import { fmt, fmtCarbon } from "@/lib/lca/format";
import { MODULE_META } from "@/lib/lca/quality";
import { TOTAL_MODULES, type Project, type ProjectResult } from "@/lib/lca/types";
import { cn } from "@/lib/utils";

/** The ledger's running balance: beside the ledger on wide screens, under it on narrow ones. */
export function LiveTotal({ id, project, result }: { id?: string; project: Project; result: ProjectResult }) {
  const total = fmtCarbon(result.total);

  return (
    <aside id={id} className="scroll-mt-28 space-y-5 rounded-lg border border-border bg-card p-5" aria-live="polite">
      <div className="space-y-1.5">
        <p className="eyebrow">Total</p>
        <p className="figure tabular text-figure">
          {total.value}
          <span className="ml-1.5 align-baseline font-sans text-base font-normal tracking-normal text-muted-foreground [font-variation-settings:'wdth'_100]">
            {total.unit}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {project.scope.functionalUnit ? `per ${project.scope.functionalUnit}` : "whole inventory"}
          {result.perFloorArea != null && ` · ${fmt(result.perFloorArea, 3)} kg CO₂e/m²`}
        </p>
      </div>
      <ModuleBreakdown modules={result.modules} compact />
      {result.items.length > 1 && (
        <div className="space-y-2.5">
          <p className="eyebrow">Biggest lines</p>
          <HotspotChart items={result.items} limit={3} />
        </div>
      )}
      {result.warnings.length > 0 && (
        <p className="text-xs font-medium text-warning">
          {result.warnings.length} line{result.warnings.length > 1 ? "s need" : " needs"} a fix
        </p>
      )}
    </aside>
  );
}

/**
 * Phones and tablets: the total stays on screen while you scroll a long
 * ledger, and slides away once the full breakdown comes into view (same
 * information twice is noise). Tap it to jump to the breakdown.
 */
export function TotalBar({ targetId, result }: { targetId: string; result: ProjectResult }) {
  const [hidden, setHidden] = useState(false);
  const total = fmtCarbon(result.total);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-[transform,opacity] duration-200 ease-(--ease-drawer) lg:hidden print:hidden",
        hidden && "pointer-events-none translate-y-full opacity-0 motion-reduce:translate-y-0",
      )}
      inert={hidden}
    >
      <button
        type="button"
        aria-label={`Total ${total.value} ${total.unit}. Show the breakdown`}
        onClick={() => {
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          document.getElementById(targetId)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }}
        className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-2.5 text-left sm:px-6"
      >
        <span className="shrink-0">
          <span className="eyebrow block">Total</span>
          <span className="figure tabular block text-2xl leading-none">
            {total.value}
            <span className="ml-1 font-sans text-sm font-normal text-muted-foreground [font-variation-settings:'wdth'_100]">
              {total.unit}
            </span>
          </span>
        </span>
        <StackedBar
          className="min-w-0 flex-1"
          height={8}
          segments={TOTAL_MODULES.map((m) => ({
            key: m,
            label: `${MODULE_META[m].label} ${MODULE_META[m].name}`,
            value: result.modules[m],
            color: MODULE_META[m].color,
          }))}
        />
        <ChevronUp aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </div>
  );
}
