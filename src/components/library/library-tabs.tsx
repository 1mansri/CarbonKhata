"use client";

import { Tabs } from "@base-ui/react/tabs";

export function LibraryTabs({ curated, live }: { curated: React.ReactNode; live: React.ReactNode }) {
  return (
    <Tabs.Root defaultValue="curated" className="flex flex-col gap-6">
      <Tabs.List className="relative flex gap-1 border-b border-border">
        {[
          { value: "curated", label: "Curated factors" },
          { value: "live", label: "Live facility data" },
        ].map((t) => (
          <Tabs.Tab
            key={t.value}
            value={t.value}
            className="relative z-10 h-9 px-3 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground data-active:font-medium data-active:text-foreground"
          >
            {t.label}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator className="absolute bottom-0 left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-brand-accent transition-[translate,width] duration-200 ease-(--ease-in-out) motion-reduce:transition-none" />
      </Tabs.List>
      <Tabs.Panel value="curated" className="outline-none">
        {curated}
      </Tabs.Panel>
      <Tabs.Panel value="live" className="outline-none">
        {live}
      </Tabs.Panel>
    </Tabs.Root>
  );
}
