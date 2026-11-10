"use client";

import { useMemo, useState } from "react";
import { Dices, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleBreakdown } from "@/components/charts/module-breakdown";
import { HotspotChart } from "@/components/charts/hotspot-chart";
import { ProvenanceBar } from "@/components/charts/provenance-bar";
import { UncertaintyChart } from "@/components/charts/uncertainty-chart";
import { fmt, fmtCarbon } from "@/lib/lca/format";
import { provenanceShares } from "@/lib/lca/provenance";
import { MODULE_META } from "@/lib/lca/quality";
import { runMonteCarlo, type UncertaintyResult } from "@/lib/lca/uncertainty";
import type { Project, ProjectResult } from "@/lib/lca/types";

export function ResultsView({ project, result }: { project: Project; result: ProjectResult }) {
  const shares = useMemo(() => provenanceShares(project), [project]);
  const total = fmtCarbon(result.total);

  if (project.items.length === 0) {
    return <p className="text-sm text-muted-foreground">Add materials to the ledger to see results.</p>;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section className="space-y-5 lg:col-span-2">
        <div className="space-y-2">
          <p className="eyebrow">Total</p>
          <p className="figure tabular text-figure">
            {total.value}
            <span className="ml-2 font-sans text-lg font-normal tracking-normal text-muted-foreground [font-variation-settings:'wdth'_100]">
              {total.unit}
            </span>
          </p>
          {project.scope.functionalUnit && (
            <p className="text-sm text-muted-foreground">per {project.scope.functionalUnit}</p>
          )}
        </div>
        <ModuleBreakdown modules={result.modules} height={32} />
      </section>

      <Panel title="Biggest lines">
        <HotspotChart items={result.items} />
      </Panel>

      <Panel title="How much is Indian data?">
        <ProvenanceBar shares={shares} />
      </Panel>

      <Panel title="Uncertainty" className="lg:col-span-2">
        <Uncertainty project={project} deterministic={result.total} />
      </Panel>

      <Panel title="Every calculation" className="lg:col-span-2">
        <WorkingTable result={result} />
      </Panel>
    </div>
  );
}

function Panel({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`min-w-0 space-y-4 ${className ?? ""}`}>
      <h2 className="border-b border-border pb-2.5 text-heading font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Uncertainty({ project, deterministic }: { project: Project; deterministic: number }) {
  const [mc, setMc] = useState<{ result: UncertaintyResult; forUpdatedAt: string } | null>(null);
  const [pending, setPending] = useState(false);
  const stale = mc && mc.forUpdatedAt !== project.updatedAt;

  async function run() {
    setPending(true);
    // Let the spinner paint before the synchronous simulation runs.
    await new Promise((resolve) => setTimeout(resolve, 30));
    setMc({ result: runMonteCarlo(project, 5000, 42), forUpdatedAt: project.updatedAt });
    setPending(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" disabled={pending} onClick={run}>
          {pending ? <Loader2 className="animate-spin" /> : <Dices />}
          {mc ? "Run again" : "Run 5,000 simulations"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Each factor varies within its published range (triangular, seed 42).
          {stale && " Inputs changed since this run."}
        </p>
      </div>
      {mc && (
        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <UncertaintyChart result={mc.result} deterministic={deterministic} />
          <dl className="grid grid-cols-[auto_1fr] content-start gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">95% interval</dt>
            <dd className="tabular text-right">
              {fmt(mc.result.p2_5, 3)} – {fmt(mc.result.p97_5, 3)}
            </dd>
            <dt className="text-muted-foreground">Median</dt>
            <dd className="tabular text-right">{fmt(mc.result.p50, 4)}</dd>
            <dt className="text-muted-foreground">Point estimate</dt>
            <dd className="tabular text-right">{fmt(deterministic, 4)}</dd>
            <dt className="text-muted-foreground">Range coverage</dt>
            <dd className="tabular text-right">{fmt(mc.result.coverage * 100, 3)}% of total</dd>
            {mc.result.coverage < 0.5 && (
              <dd className="col-span-2 mt-1 text-xs leading-relaxed text-warning">
                Only {fmt(mc.result.coverage * 100, 2)}% of the total has a published range. The rest is held fixed, so
                the real uncertainty is wider. Factors with ranges (EPD means, steel routes) widen coverage.
              </dd>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

/** Wide: a table. Narrow: one block per calculation, so nothing scrolls sideways. */
function WorkingTable({ result }: { result: ProjectResult }) {
  const cell = "px-3 py-2 align-top @max-2xl:p-0";
  return (
    <div className="@container rounded-lg border border-border bg-card">
      <table className="w-full text-sm @max-2xl:block">
        <thead className="@max-2xl:hidden">
          <tr className="eyebrow border-b border-border text-left">
            <th className="px-3 py-2 font-medium">Line</th>
            <th className="px-3 py-2 font-medium">Module</th>
            <th className="px-3 py-2 font-medium">Working</th>
            <th className="px-3 py-2 text-right font-medium normal-case">kg CO₂e</th>
          </tr>
        </thead>
        <tbody className="@max-2xl:block">
          {result.items.flatMap((item) =>
            (Object.keys(item.working) as (keyof typeof item.working)[]).map((m, i) => (
              <tr
                key={`${item.itemId}-${m}`}
                className="border-b border-border/60 last:border-b-0 @max-2xl:grid @max-2xl:grid-cols-[auto_minmax(0,1fr)_auto] @max-2xl:gap-x-3 @max-2xl:gap-y-1 @max-2xl:px-3 @max-2xl:py-2.5"
              >
                <td className={`${cell} @max-2xl:col-span-3 @max-2xl:font-medium ${i === 0 ? "" : "@max-2xl:hidden"}`}>
                  {i === 0 ? item.label : ""}
                </td>
                <td className={`${cell} font-mono text-2xs whitespace-nowrap @max-2xl:pt-px`}>{MODULE_META[m].label}</td>
                <td className={`${cell} text-xs text-muted-foreground`}>{item.working[m]}</td>
                <td className={`${cell} tabular text-right`}>{fmt(item.modules[m])}</td>
              </tr>
            )),
          )}
          {result.siteEnergy.map((e) => (
            <tr
              key={e.itemId}
              className="border-b border-border/60 last:border-b-0 @max-2xl:grid @max-2xl:grid-cols-[auto_minmax(0,1fr)_auto] @max-2xl:gap-x-3 @max-2xl:gap-y-1 @max-2xl:px-3 @max-2xl:py-2.5"
            >
              <td className={`${cell} @max-2xl:col-span-3 @max-2xl:font-medium`}>{e.label}</td>
              <td className={`${cell} font-mono text-2xs @max-2xl:pt-px`}>A5</td>
              <td className={`${cell} text-xs text-muted-foreground`}>{e.working}</td>
              <td className={`${cell} tabular text-right`}>{fmt(e.value)}</td>
            </tr>
          ))}
          <tr className="bg-muted/50 font-medium @max-2xl:flex @max-2xl:justify-between @max-2xl:gap-3 @max-2xl:px-3 @max-2xl:py-2.5">
            <td className="px-3 py-2.5 @max-2xl:p-0" colSpan={3}>
              Total (D reported separately)
            </td>
            <td className="tabular px-3 py-2.5 text-right @max-2xl:p-0">{fmt(result.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
