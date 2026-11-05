"use client";

import { useMemo } from "react";
import { ModuleBreakdown } from "@/components/charts/module-breakdown";
import { HotspotChart } from "@/components/charts/hotspot-chart";
import { ProvenanceBar } from "@/components/charts/provenance-bar";
import { getSource } from "@/data/lca/sources";
import { BRAND } from "@/lib/brand";
import { calculateProject } from "@/lib/lca/calculate";
import { sourcesUsed } from "@/lib/lca/export";
import { fmt } from "@/lib/lca/format";
import { provenanceShares } from "@/lib/lca/provenance";
import { MODULE_META, QUALITY_META } from "@/lib/lca/quality";
import { unitLabel } from "@/lib/lca/units";
import { TOTAL_MODULES, type Project } from "@/lib/lca/types";

/**
 * Report laid out along ISO 14044 §5.2: goal, scope, inventory, impact
 * assessment, interpretation, references. Limitations are generated from
 * the data, so nothing a reviewer needs to know is left out.
 */
export function ReportDocument({ project }: { project: Project }) {
  const result = useMemo(() => calculateProject(project), [project]);
  const shares = useMemo(() => provenanceShares(project), [project]);
  const sources = sourcesUsed(project);
  const { scope } = project;
  const b = scope.boundary;
  const modulesIn = ["A1–A3", b.a4 && "A4", b.a5 && "A5", b.c && "C1–C4"].filter(Boolean).join(", ");
  const top = [...result.items].sort((x, y) => y.total - x.total)[0];

  const limitations: string[] = [];
  const proxies = project.items.filter((i) => !QUALITY_META[i.material.quality].india).map((i) => i.material.name);
  if (proxies.length) limitations.push(`Non-Indian or user-supplied A1–A3 factors used for: ${proxies.join(", ")}.`);
  const direct = project.items.filter((i) => i.material.quality === "india-live").map((i) => i.material.name);
  if (direct.length)
    limitations.push(`Factors for ${direct.join(", ")} cover direct facility emissions only (no purchased electricity or upstream supply), so A1–A3 is underestimated for these lines.`);
  const co2Only = [
    ...project.items.filter((i) => i.material.indicator === "CO2 only").map((i) => i.material.name),
    ...project.items
      .filter((i) => b.a4 && i.transport?.factor.indicator === "CO2 only")
      .map((i) => `${i.transport!.factor.name} (A4)`),
    ...(b.a5 ? project.siteEnergy.filter((e) => e.factor.indicator === "CO2 only").map((e) => e.factor.name) : []),
  ];
  if (co2Only.length)
    limitations.push(`These factors report CO2 only, so other greenhouse gases are not captured: ${[...new Set(co2Only)].join(", ")}.`);
  const backgrounds = [
    ...new Set(project.items.map((i) => i.material.backgroundDb).filter((x): x is string => !!x)),
  ];
  if (backgrounds.length > 1)
    limitations.push(`EPD factors rest on different background databases (${backgrounds.join("; ")}); EPD results are strictly comparable only under the conditions of EN 15804+A2.`);
  if (b.c) limitations.push("End-of-life (C1–C4) uses UK DESNZ waste-disposal factors as proxies; no open Indian dataset exists.");
  limitations.push("Use stage (B1–B7) is outside the system boundary.");
  result.warnings.forEach((w) => limitations.push(`Data gap: ${w}`));

  return (
    <article className="mx-auto max-w-3xl space-y-10 text-[15px] leading-relaxed print:max-w-none print:text-[11pt]">
      <header className="space-y-2 border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">Embodied carbon assessment</p>
        <h1 className="display text-3xl font-semibold">{project.name}</h1>
        <p className="text-sm text-muted-foreground">
          Prepared with {BRAND.name} on {new Date().toISOString().slice(0, 10)}, following ISO 14040/14044 and the EN
          15804+A2 module structure.
        </p>
      </header>

      <Section n="1" title="Goal">
        <p>{scope.goal || "Not stated."}</p>
      </Section>

      <Section n="2" title="Scope">
        <dl className="grid grid-cols-[11rem_1fr] gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">Functional unit</dt>
          <dd>{scope.functionalUnit || "Not stated"}</dd>
          <dt className="text-muted-foreground">System boundary</dt>
          <dd>
            {modulesIn}
            {b.d ? "; module D reported separately" : ""}. B1–B7 excluded.
          </dd>
          <dt className="text-muted-foreground">Impact category</dt>
          <dd>Climate change, GWP100, kg CO₂e, as reported by each data source.</dd>
          <dt className="text-muted-foreground">Assumptions</dt>
          <dd>{scope.assumptions || "None stated."}</dd>
        </dl>
      </Section>

      <Section n="3" title="Life cycle inventory">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-1.5 pr-2 font-medium">Material</th>
              <th className="py-1.5 pr-2 text-right font-medium">Quantity</th>
              <th className="py-1.5 pr-2 text-right font-medium">Factor</th>
              <th className="py-1.5 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {project.items.map((item) => (
              <tr key={item.id} className="border-b border-border/60 align-top">
                <td className="py-1.5 pr-2">{item.label || item.material.name}</td>
                <td className="py-1.5 pr-2 text-right whitespace-nowrap">
                  {fmt(item.quantity)} {unitLabel(item.unit)}
                </td>
                <td className="py-1.5 pr-2 text-right whitespace-nowrap">
                  {fmt(item.material.gwp)} /{unitLabel(item.material.declaredUnit)}
                </td>
                <td className="py-1.5 text-xs text-muted-foreground">
                  {getSource(item.material.source.sourceId)?.short}, {item.material.source.locator}
                </td>
              </tr>
            ))}
            {project.siteEnergy.map((e) => (
              <tr key={e.id} className="border-b border-border/60 align-top">
                <td className="py-1.5 pr-2">{e.factor.name}</td>
                <td className="py-1.5 pr-2 text-right whitespace-nowrap">
                  {fmt(e.quantity)} {unitLabel(e.factor.unit)}
                </td>
                <td className="py-1.5 pr-2 text-right whitespace-nowrap">
                  {fmt(e.factor.value)} /{unitLabel(e.factor.unit)}
                </td>
                <td className="py-1.5 text-xs text-muted-foreground">
                  {getSource(e.factor.source.sourceId)?.short}, {e.factor.source.locator}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section n="4" title="Impact assessment">
        <p>
          Total: <strong className="tabular">{fmt(result.total)} kg CO₂e</strong>
          {scope.functionalUnit ? ` per ${scope.functionalUnit}` : ""}
          {result.perFloorArea != null ? `, or ${fmt(result.perFloorArea, 3)} kg CO₂e/m² of floor area` : ""}.
        </p>
        <ModuleBreakdown modules={result.modules} />
        <table className="w-full text-sm">
          <tbody>
            {TOTAL_MODULES.map((m) => (
              <tr key={m} className="border-b border-border/60">
                <td className="py-1">
                  {MODULE_META[m].label} {MODULE_META[m].name}
                </td>
                <td className="py-1 text-right">{fmt(result.modules[m])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section n="5" title="Interpretation">
        {top && result.total > 0 && (
          <p>
            The largest contributor is {top.label}, at {fmt((top.total / result.total) * 100, 3)}% of the total.
          </p>
        )}
        <HotspotChart items={result.items} />
        <ProvenanceBar shares={shares} />
        <h3 className="pt-2 font-medium">Limitations</h3>
        <ul className="list-disc space-y-1 pl-5">
          {limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Section>

      <Section n="6" title="References">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          {sources.map((s) => (
            <li key={s.id}>
              {s.citation} {s.url && <span className="break-all text-muted-foreground">{s.url}</span>} Licence:{" "}
              {s.license}
            </li>
          ))}
        </ol>
      </Section>
    </article>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 break-inside-avoid-page">
      <h2 className="flex items-baseline gap-3 text-lg font-semibold">
        <span className="tabular text-muted-foreground">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
