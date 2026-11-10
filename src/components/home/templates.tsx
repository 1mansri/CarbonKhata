"use client";

import { useRouter } from "next/navigation";
import { TEMPLATES, type Template } from "@/data/lca/templates";
import { calculateProject } from "@/lib/lca/calculate";
import { fmtCarbon } from "@/lib/lca/format";
import { createProject } from "@/lib/lca/project";
import { saveProject } from "@/lib/lca/project-store";

/** Template totals never change at runtime: compute them once. */
const TOTALS = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, fmtCarbon(calculateProject(createProject(t.build())).total)]),
);

/** Alternatives for the same job sit side by side so the totals compare at a glance. */
const GROUPS = TEMPLATES.reduce<[string, Template[]][]>((acc, t) => {
  const name = t.group ?? "Other examples";
  const hit = acc.find(([g]) => g === name);
  if (hit) hit[1].push(t);
  else acc.push([name, [t]]);
  return acc;
}, []);

export function Templates() {
  const router = useRouter();
  if (TEMPLATES.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className="condensed text-sm font-semibold">Worked examples</h2>
      {GROUPS.map(([group, templates]) => (
        <div key={group} className="space-y-3">
          <h3 className="text-sm text-muted-foreground">{group}</h3>
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => {
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
                    <span className="mt-auto text-xs text-muted-foreground">
                      {t.kind === "reproduces" ? "Reproduces" : "Quantities from"} {t.basedOn}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
