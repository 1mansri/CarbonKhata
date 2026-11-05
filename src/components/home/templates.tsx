"use client";

import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/data/lca/templates";
import { calculateProject } from "@/lib/lca/calculate";
import { fmtCarbon } from "@/lib/lca/format";
import { createProject } from "@/lib/lca/project";
import { saveProject } from "@/lib/lca/project-store";

/** Template totals never change at runtime: compute them once. */
const TOTALS = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, fmtCarbon(calculateProject(createProject(t.build())).total)]),
);

export function Templates() {
  const router = useRouter();
  if (TEMPLATES.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="condensed text-sm font-semibold">Worked examples</h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {TEMPLATES.map((t) => {
          const total = TOTALS[t.id];
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  const p = createProject(t.build());
                  saveProject(p);
                  router.push(`/project/${p.id}`);
                }}
                className="group flex h-full w-full flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-[border-color,transform] duration-150 ease-(--ease-out) hover:border-foreground/30 active:scale-[0.99] motion-reduce:active:scale-100"
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="font-medium group-hover:text-primary">{t.title}</span>
                  <span className="tabular shrink-0 text-sm">
                    {total.value} <span className="text-muted-foreground">{total.unit}</span>
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">{t.summary}</span>
                {t.basedOn && <span className="text-xs text-muted-foreground">Reproduces {t.basedOn}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
