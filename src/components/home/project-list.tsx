"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateProject } from "@/lib/lca/calculate";
import { fmtCarbon } from "@/lib/lca/format";
import { createProject, parseProjectFile } from "@/lib/lca/project";
import { saveProject, useProjects } from "@/lib/lca/project-store";
import { MODULE_META } from "@/lib/lca/quality";
import { TOTAL_MODULES } from "@/lib/lca/types";

export function ProjectList() {
  const router = useRouter();
  const projects = useProjects();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // The store returns the same snapshot until something changes, so totals
  // are computed once per change, not on every render.
  const list = useMemo(
    () =>
      projects
        ? Object.values(projects)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((p) => ({ p, r: calculateProject(p) }))
        : null,
    [projects],
  );

  function start() {
    const p = createProject();
    saveProject(p);
    router.push(`/project/${p.id}`);
  }

  async function importFile(file: File) {
    setError(null);
    try {
      const p = parseProjectFile(await file.text());
      saveProject(p);
      router.push(`/project/${p.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="condensed mr-auto text-sm font-semibold">Your projects</h2>
        <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
          <FolderOpen />
          Open project file
        </Button>
        <Button size="sm" onClick={start}>
          <Plus />
          New project
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {list === null ? (
        <Skeleton className="h-24 w-full" />
      ) : list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Nothing here yet. Start a project or open a worked example. Everything stays in this browser.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {list.map(({ p, r }) => {
            const total = fmtCarbon(r.total);
            return (
              <li key={p.id}>
                <Link
                  href={`/project/${p.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 px-4 py-3 transition-colors duration-150 hover:bg-muted/60 sm:grid-cols-[minmax(0,1fr)_10rem_8rem]"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {p.scope.functionalUnit || "No functional unit"}, {p.items.length} line{p.items.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <MiniModuleBar modules={r.modules} />
                  <span className="tabular text-right text-sm">
                    {total.value} <span className="text-muted-foreground">{total.unit}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function MiniModuleBar({ modules }: { modules: Record<string, number> }) {
  const total = TOTAL_MODULES.reduce((s, m) => s + modules[m], 0);
  return (
    <span className="hidden h-1.5 overflow-hidden rounded-full bg-muted sm:flex" aria-hidden>
      {total > 0 &&
        TOTAL_MODULES.map((m) => (
          <span key={m} style={{ width: `${(modules[m] / total) * 100}%`, backgroundColor: MODULE_META[m].color }} />
        ))}
    </span>
  );
}
