import { VALIDATION_CASES } from "@/data/lca/validation";
import { calculateProject } from "@/lib/lca/calculate";
import { fmt } from "@/lib/lca/format";
import { createProject } from "@/lib/lca/project";

/** Published results reproduced by the engine (also enforced by unit tests). */
export function ValidationPanel() {
  if (VALIDATION_CASES.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-heading font-semibold">Validation against a published Indian study</h2>
      {VALIDATION_CASES.map((c) => {
        const result = calculateProject(createProject(c.build()));
        return (
          <div key={c.id} className="space-y-3">
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <caption className="px-4 pt-3 pb-1 text-left">
                  <span className="font-medium">{c.title}</span>
                  <span className="block text-xs text-muted-foreground">{c.citation}</span>
                </caption>
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Stage</th>
                    <th className="px-4 py-2 text-right font-medium">Published, kg CO₂e</th>
                    <th className="px-4 py-2 text-right font-medium">CarbonKhata</th>
                    <th className="px-4 py-2 text-right font-medium">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {c.checks.map((check) => {
                    const ours = result.modules[check.module];
                    return (
                      <tr key={check.module} className="border-b border-border/60 align-top last:border-b-0">
                        <td className="px-4 py-2.5">
                          {check.label}
                          {check.note && <div className="text-xs text-muted-foreground">{check.note}</div>}
                        </td>
                        <td className="tabular px-4 py-2.5 text-right">{fmt(check.published, 8)}</td>
                        <td className="tabular px-4 py-2.5 text-right">{fmt(ours, 8)}</td>
                        <td className="tabular px-4 py-2.5 text-right">{fmt(ours - check.published, 2)} kg</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              {result.items.length} inventory lines rebuilt with the study&apos;s own factors and units (per 1000
              bricks, quintals, packs of 10 and 100, litres, metres). {c.notReproduced}
            </p>
          </div>
        );
      })}
    </section>
  );
}
