import { PrismaActivityRepository } from "@/lib/repositories/prisma-activity-repository";
import { SearchService } from "@/lib/services/search-service";
import { SourceCard } from "@/components/sources/source-card";
import { SOURCES } from "@/data/lca/sources";
import { MODULE_META } from "@/lib/lca/quality";
import { ValidationPanel } from "@/components/method/validation-panel";

export const metadata = { title: "Method" };

// Live source cards read DB state that the sync button changes.
export const dynamic = "force-dynamic";

const FORMULAS = [
  { m: "A1-A3" as const, f: "quantity in declared unit × factor" },
  { m: "A4" as const, f: "mass (t) × distance (km) × factor per t·km, or trips × km × factor per vehicle-km" },
  { m: "A5" as const, f: "wastage % × (A1–A3 + A4)  +  site energy × factor" },
  { m: "C1-C4" as const, f: "mass (t) × end-of-life route factor, or the EPD's declared C1–C4" },
  { m: "D" as const, f: "the EPD's declared module D, reported beside the total" },
];

export default async function MethodPage() {
  const live = await new SearchService(new PrismaActivityRepository()).listSources();
  const curated = Object.values(SOURCES).filter((s) => s.id !== "user");

  return (
    <div className="flex max-w-4xl flex-col gap-14">
      <header className="space-y-2">
        <h1 className="display text-3xl font-semibold">Method</h1>
        <p className="max-w-2xl text-muted-foreground">
          ISO 14040/14044 with the EN 15804+A2 module structure. One impact category: climate change, GWP100, in kg
          CO₂e. Every number is linear and shown with its working.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="condensed text-sm font-semibold">How each module is calculated</h2>
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {FORMULAS.map(({ m, f }) => (
            <li key={m} className="grid grid-cols-[5rem_minmax(0,1fr)] items-baseline gap-4 px-4 py-3">
              <span className="flex items-center gap-2 font-medium">
                <span aria-hidden className="size-2.5 rounded-[2px]" style={{ backgroundColor: MODULE_META[m].color }} />
                {MODULE_META[m].label}
              </span>
              <span className="text-sm">{f}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Total = A1–A3 + A4 + A5 + C1–C4. Uncertainty: Monte Carlo with triangular distributions over each
          factor&apos;s published range (5,000 runs, seed 42).
        </p>
      </section>

      <ValidationPanel />

      <section className="space-y-4">
        <h2 className="condensed text-sm font-semibold">Sources and licences</h2>
        <ol className="space-y-3">
          {curated.map((s) => (
            <li key={s.id} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
              <p>{s.citation}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                <a href={s.url} target="_blank" rel="noreferrer" className="break-all underline underline-offset-2 hover:text-primary">
                  {s.url}
                </a>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Licence: {s.license}</p>
            </li>
          ))}
        </ol>
      </section>

      {live.length > 0 && (
        <section className="space-y-4">
          <h2 className="condensed text-sm font-semibold">Live data feeds</h2>
          <div className="flex flex-col gap-4">
            {live.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="condensed text-sm font-semibold">What this tool does not do</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Impact categories other than climate change. Open Indian background data for them doesn&apos;t exist.</li>
          <li>The use stage (B1–B7): operational energy and maintenance.</li>
          <li>ecoinvent, GaBi or ICE data. They need licences that don&apos;t allow embedding in a free tool.</li>
          <li>Certified EPDs. Results support research and design decisions, not regulatory claims.</li>
        </ul>
      </section>
    </div>
  );
}
