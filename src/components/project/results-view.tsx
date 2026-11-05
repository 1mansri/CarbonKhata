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
      <section className="space-y-4 lg:col-span-2">
        <p className="display tabular text-5xl font-semibold">
          {total.value}
          <span className="ml-2 text-lg font-normal text-muted-foreground [font-variation-settings:'wdth'_100]">
            {total.unit}
            {project.scope.functionalUnit && ` per ${project.scope.functionalUnit}`}
          </span>
        </p>
        <ModuleBreakdown modules={result.modules} height={36} />
      </section>

      <Panel title="Where the carbon comes from">
        <HotspotChart items={result.items} />
      </Panel>

      <Panel title="How Indian is this number?">
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
    <section className={`space-y-4 ${className ?? ""}`}>
      <h2 className="condensed border-b border-border pb-2 text-sm font-semibold">{title}</h2>
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
          Triangular distributions from each factor&apos;s published range, seed 42.
          {stale && " Inputs changed since the last run."}
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
                Only {fmt(mc.result.coverage * 100, 2)}% of this total comes from factors with a published range; the
                rest is held fixed, so the true uncertainty is wider than this interval. Choose range-bearing factors
                (e.g. EPD means, Ministry of Steel routes) to widen coverage.
              </dd>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

function WorkingTable({ result }: { result: ProjectResult }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="condensed border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-semibold">Line</th>
            <th className="px-3 py-2 font-semibold">Module</th>
            <th className="px-3 py-2 font-semibold">Working</th>
            <th className="px-3 py-2 text-right font-semibold">kg CO₂e</th>
          </tr>
        </thead>
        <tbody>
          {result.items.flatMap((item) =>
            (Object.keys(item.working) as (keyof typeof item.working)[]).map((m, i) => (
              <tr key={`${item.itemId}-${m}`} className="border-b border-border/60 last:border-b-0">
                <td className="px-3 py-1.5 align-top">{i === 0 ? item.label : ""}</td>
                <td className="px-3 py-1.5 align-top whitespace-nowrap">{MODULE_META[m].label}</td>
                <td className="px-3 py-1.5 align-top text-xs text-muted-foreground">{item.working[m]}</td>
                <td className="px-3 py-1.5 text-right align-top">{fmt(item.modules[m])}</td>
              </tr>
            )),
          )}
          {result.siteEnergy.map((e) => (
            <tr key={e.itemId} className="border-b border-border/60 last:border-b-0">
              <td className="px-3 py-1.5">{e.label}</td>
              <td className="px-3 py-1.5">A5</td>
              <td className="px-3 py-1.5 text-xs text-muted-foreground">{e.working}</td>
              <td className="px-3 py-1.5 text-right">{fmt(e.value)}</td>
            </tr>
          ))}
          <tr className="bg-muted/50 font-medium">
            <td className="px-3 py-2" colSpan={3}>
              Total A1–A5 + C1–C4 (D reported separately)
            </td>
            <td className="px-3 py-2 text-right">{fmt(result.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
