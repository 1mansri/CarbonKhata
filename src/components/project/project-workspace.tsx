"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs } from "@base-ui/react/tabs";
import { Menu } from "@base-ui/react/menu";
import { ArrowLeft, Download, FileJson, FileSpreadsheet, Printer, Quote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectEditor } from "@/components/project/use-project-editor";
import { Ledger } from "@/components/project/ledger";
import { ProjectAi } from "@/components/project/project-ai";
import { SiteEnergy } from "@/components/project/site-energy";
import { LiveTotal } from "@/components/project/live-total";
import { ResultsView } from "@/components/project/results-view";
import { ScopeForm } from "@/components/project/scope-form";
import { CompareView } from "@/components/project/compare-view";
import { ReportDocument } from "@/components/project/report-document";
import { deleteProject } from "@/lib/lca/project-store";
import { downloadBibtex, downloadProjectFile, downloadWorkbook } from "@/lib/lca/export";
import { MODULE_META } from "@/lib/lca/quality";

const TABS = [
  { value: "ledger", label: "Ledger" },
  { value: "results", label: "Results" },
  { value: "scope", label: "Scope" },
  { value: "compare", label: "Compare" },
  { value: "report", label: "Report" },
] as const;

export function ProjectWorkspace({ id }: { id: string }) {
  const router = useRouter();
  const { project, result, update } = useProjectEditor(id);

  if (project === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (project === null || !result) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-medium">This project isn&apos;t in this browser.</p>
        <p className="text-sm text-muted-foreground">
          Projects are saved per browser. Import its project file from the projects page.
        </p>
        <Button variant="outline" render={<Link href="/" />} nativeButton={false}>
          Go to projects
        </Button>
      </div>
    );
  }

  const b = project.scope.boundary;
  const included = [
    { label: MODULE_META["A1-A3"].label, color: MODULE_META["A1-A3"].color, on: true },
    { label: MODULE_META.A4.label, color: MODULE_META.A4.color, on: b.a4 },
    { label: MODULE_META.A5.label, color: MODULE_META.A5.color, on: b.a5 },
    { label: MODULE_META["C1-C4"].label, color: MODULE_META["C1-C4"].color, on: b.c },
    { label: "D", color: MODULE_META.D.color, on: b.d },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" />
            Projects
          </Link>
          <textarea
            aria-label="Project name"
            rows={1}
            value={project.name}
            onChange={(e) => update((p) => ({ ...p, name: e.target.value.replace(/\n/g, " ") }))}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
            className="display block w-full resize-none rounded-md bg-transparent text-xl font-semibold outline-none field-sizing-content sm:text-2xl md:text-3xl focus-visible:ring-3 focus-visible:ring-ring/30"
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{project.scope.functionalUnit || "No functional unit yet"}</span>
            <span className="flex items-center gap-1" aria-label="Modules in the system boundary">
              {included.map((m) => (
                <span
                  key={m.label}
                  className="condensed rounded-sm px-1.5 py-0.5 text-[11px] font-semibold"
                  style={
                    m.on
                      ? { backgroundColor: `color-mix(in oklab, ${m.color} 18%, transparent)`, color: "var(--foreground)" }
                      : { textDecoration: "line-through", opacity: 0.5 }
                  }
                >
                  {m.label}
                </span>
              ))}
            </span>
          </div>
        </div>
        <ExportMenu
          onExcel={() => downloadWorkbook(project)}
          onJson={() => downloadProjectFile(project)}
          onBib={() => downloadBibtex(project)}
          onPrint={() => window.open(`/project/${project.id}/report`, "_blank")}
          onDelete={() => {
            if (!window.confirm(`Delete "${project.name}" from this browser? Export it first if you need it.`)) return;
            deleteProject(project.id);
            router.push("/");
          }}
        />
      </div>

      <Tabs.Root defaultValue="ledger" className="flex flex-col gap-6">
        <Tabs.List className="relative flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]">
          {TABS.map((t) => (
            <Tabs.Tab
              key={t.value}
              value={t.value}
              className="relative z-10 h-9 px-3 text-sm whitespace-nowrap text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground data-active:font-medium data-active:text-foreground"
            >
              {t.label}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator className="absolute bottom-0 left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-brand-accent transition-[translate,width] duration-200 ease-(--ease-in-out) motion-reduce:transition-none" />
        </Tabs.List>

        {/* Kept mounted so an AI draft under review survives a look at another tab. */}
        <Tabs.Panel value="ledger" keepMounted className="flex flex-col gap-6 outline-none data-hidden:hidden">
          {/* Full width so the review table has room before its lines join the ledger. */}
          <ProjectAi project={project} update={update} />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0 space-y-8">
              <Ledger project={project} result={result} update={update} />
              <SiteEnergy project={project} result={result} update={update} />
            </div>
            <div className="lg:sticky lg:top-20 lg:self-start">
              <LiveTotal project={project} result={result} />
            </div>
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="results" className="outline-none">
          <ResultsView project={project} result={result} />
        </Tabs.Panel>
        <Tabs.Panel value="scope" className="outline-none">
          <ScopeForm project={project} update={update} />
        </Tabs.Panel>
        <Tabs.Panel value="compare" className="outline-none">
          <CompareView project={project} />
        </Tabs.Panel>
        <Tabs.Panel value="report" className="outline-none">
          <div className="rounded-lg border border-border bg-card px-6 py-10 sm:px-10">
            <ReportDocument project={project} />
          </div>
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  );
}

const itemClass =
  "flex cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none select-none data-highlighted:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground";

function ExportMenu(props: {
  onExcel: () => void;
  onJson: () => void;
  onBib: () => void;
  onPrint: () => void;
  onDelete: () => void;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="outline" />}>
        <Download />
        Export
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50 outline-none">
          <Menu.Popup className="min-w-56 origin-(--transform-origin) rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-[scale,opacity] duration-150 ease-(--ease-out) data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0 motion-reduce:transition-none">
            <Menu.Item className={itemClass} onClick={props.onExcel}>
              <FileSpreadsheet />
              Excel with live formulas
            </Menu.Item>
            <Menu.Item className={itemClass} onClick={props.onPrint}>
              <Printer />
              Printable report (PDF)
            </Menu.Item>
            <Menu.Item className={itemClass} onClick={props.onBib}>
              <Quote />
              References (BibTeX)
            </Menu.Item>
            <Menu.Item className={itemClass} onClick={props.onJson}>
              <FileJson />
              Project file
            </Menu.Item>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.Item className={`${itemClass} text-destructive [&_svg]:text-destructive`} onClick={props.onDelete}>
              <Trash2 />
              Delete project
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
