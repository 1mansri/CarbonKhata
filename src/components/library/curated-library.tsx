"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { QualityBadge } from "@/components/project/quality-badge";
import { FactorStrip } from "@/components/library/factor-strip";
import { MATERIALS } from "@/data/lca/materials";
import { TRANSPORT_FACTORS } from "@/data/lca/transport";
import { SITE_FACTORS } from "@/data/lca/site";
import { getSource } from "@/data/lca/sources";
import { fmt } from "@/lib/lca/format";
import { unitLabel } from "@/lib/lca/units";
import type { DataQuality, SourceRef } from "@/lib/lca/types";

interface Row {
  id: string;
  group: string;
  name: string;
  value: number;
  unit: string;
  low?: number;
  high?: number;
  quality: DataQuality;
  source: SourceRef;
  year: number;
  notes?: string;
}

const ROWS: Row[] = [
  ...MATERIALS.map((m) => ({
    id: m.id,
    group: `A1–A3, ${m.category}`,
    name: m.name,
    value: m.gwp,
    unit: `kg CO₂e/${unitLabel(m.declaredUnit)}`,
    low: m.low,
    high: m.high,
    quality: m.quality,
    source: m.source,
    year: m.year,
    notes: m.notes,
  })),
  ...TRANSPORT_FACTORS.map((t) => ({
    id: t.id,
    group: "A4, Transport",
    name: t.name,
    value: t.value,
    unit: t.basis === "tkm" ? "kg CO₂e/t·km" : "kg CO₂/vehicle-km",
    quality: t.quality,
    source: t.source,
    year: t.year,
    notes: t.notes,
  })),
  ...SITE_FACTORS.map((s) => ({
    id: s.id,
    group: "A5, Site energy and water",
    name: s.name,
    value: s.value,
    unit: `kg CO₂e/${unitLabel(s.unit)}`,
    quality: s.quality,
    source: s.source,
    year: s.year,
    notes: s.notes,
  })),
];

export function CuratedLibrary() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ROWS.filter((r) => `${r.name} ${r.group}`.toLowerCase().includes(q)) : ROWS;
  }, [query]);
  const groups = [...new Set(rows.map((r) => r.group))];

  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter factors" className="pl-9" aria-label="Filter factors" />
      </div>
      {groups.map((g) => (
        <section key={g} className="space-y-2">
          <h2 className="condensed text-sm font-semibold">{g}</h2>
          <FactorStrip materials={MATERIALS.filter((m) => rows.some((r) => r.id === m.id && r.group === g))} />
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <tbody>
                {rows
                  .filter((r) => r.group === g)
                  .map((r) => {
                    const src = getSource(r.source.sourceId);
                    return (
                      <tr key={r.id} className="border-b border-border/70 align-top last:border-b-0">
                        <td className="w-[40%] px-3 py-2.5">
                          <div className="font-medium">{r.name}</div>
                          {r.notes && (
                            <div title={r.notes} className="mt-0.5 line-clamp-1 max-w-prose text-xs text-muted-foreground">
                              {r.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <div>
                            {fmt(r.value)} <span className="text-xs text-muted-foreground">{r.unit}</span>
                          </div>
                          {r.low != null && r.high != null && (
                            <div className="text-xs text-muted-foreground">
                              {fmt(r.low)} to {fmt(r.high)}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <QualityBadge quality={r.quality} />
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          {src?.url ? (
                            <a href={src.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-primary">
                              {src.short}
                            </a>
                          ) : (
                            src?.short
                          )}
                          <div className="text-muted-foreground">{r.source.locator}</div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
