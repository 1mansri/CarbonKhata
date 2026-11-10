"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { ArrowLeft, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { NumberInput } from "@/components/ui/number-input";
import { QualityBadge } from "@/components/project/quality-badge";
import { MATERIALS } from "@/data/lca/materials";
import { getSource } from "@/data/lca/sources";
import { fmt } from "@/lib/lca/format";
import { compatibleUnits, unitLabel, MATERIAL_UNITS } from "@/lib/lca/units";
import type { MaterialCategory, MaterialFactor, Unit } from "@/lib/lca/types";
import { cn } from "@/lib/utils";

const fuse = new Fuse(MATERIALS, {
  keys: [
    { name: "name", weight: 2 },
    { name: "category", weight: 1 },
    { name: "notes", weight: 0.5 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
});

const CATEGORIES: MaterialCategory[] = [
  "Cement & binders",
  "Concrete",
  "Steel",
  "Bricks & blocks",
  "Aggregates & sand",
  "Metals",
  "Glass",
  "Finishes",
  "Other",
];

export function MaterialPicker({
  onAdd,
  onClose,
}: {
  onAdd: (material: MaterialFactor, quantity: number, unit: Unit) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"library" | "custom">("library");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MaterialFactor | null>(null);

  const results = useMemo(
    () => (query.trim() ? fuse.search(query).map((r) => r.item) : MATERIALS),
    [query],
  );
  const grouped = CATEGORIES.map((c) => [c, results.filter((m) => m.category === c)] as const).filter(
    ([, list]) => list.length > 0,
  );

  return (
    // Wide: list and details side by side. Narrow: list, then details in its place.
    <div className="enter-drop @container rounded-lg border border-border bg-card">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        {(["library", "custom"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150",
              mode === m ? "bg-secondary font-medium" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "library" ? "India library" : "Your own factor"}
          </button>
        ))}
        <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={onClose} aria-label="Close">
          <X />
        </Button>
      </div>

      {mode === "custom" ? (
        <CustomFactorForm onAdd={onAdd} />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className={cn("@2xl:border-r @2xl:border-border", selected && "@max-2xl:hidden")}>
            <div className="relative p-2">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="cement, TMT, fly ash brick…"
                className="h-10 pl-8 sm:h-9"
                aria-label="Search materials"
              />
            </div>
            <div className="max-h-[min(22rem,55svh)] overflow-y-auto overscroll-contain px-2 pb-2">
              {grouped.length === 0 && (
                <p className="px-2 py-6 text-sm text-muted-foreground">No match. Add it as your own factor, with its source.</p>
              )}
              {grouped.map(([category, list]) => (
                <div key={category} className="mb-2">
                  <p className="eyebrow px-2 pt-3 pb-1.5">{category}</p>
                  {list.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelected(m)}
                      aria-pressed={selected?.id === m.id}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors duration-100 sm:py-1.5",
                        selected?.id === m.id ? "bg-secondary" : "hover:bg-muted",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{m.name}</span>
                      <span className="tabular shrink-0 font-mono text-2xs text-muted-foreground">
                        {fmt(m.gwp)}/{unitLabel(m.declaredUnit)}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className={cn("p-4", !selected && "@max-2xl:hidden")}>
            {selected ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="-mt-1 mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground @2xl:hidden"
                >
                  <ArrowLeft className="size-3.5" />
                  All materials
                </button>
                <SelectedMaterial key={selected.id} material={selected} onAdd={onAdd} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Pick a material to see where its number comes from.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SelectedMaterial({
  material,
  onAdd,
}: {
  material: MaterialFactor;
  onAdd: (material: MaterialFactor, quantity: number, unit: Unit) => void;
}) {
  const units = compatibleUnits(material);
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState<Unit>(units.includes("t") ? "t" : material.declaredUnit);
  const source = getSource(material.source.sourceId);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <QualityBadge quality={material.quality} />
        <h3 className="font-medium leading-snug">{material.name}</h3>
        <p className="figure tabular text-3xl leading-none tracking-tight">
          {fmt(material.gwp)}
          <span className="ml-1.5 font-sans text-sm font-normal tracking-normal text-muted-foreground [font-variation-settings:'wdth'_100]">
            kg CO₂e per {unitLabel(material.declaredUnit)}
          </span>
        </p>
        {material.low != null && material.high != null && (
          <p className="tabular text-xs text-muted-foreground">
            Range {fmt(material.low)} to {fmt(material.high)}
          </p>
        )}
      </div>
      <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1.5 text-xs">
        <dt className="eyebrow">Source</dt>
        <dd>
          {source?.url ? (
            <a href={source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-primary">
              {source.short}
            </a>
          ) : (
            source?.short
          )}
        </dd>
        <dt className="eyebrow">Where</dt>
        <dd className="font-mono text-2xs">{material.source.locator}</dd>
        <dt className="eyebrow">Covers</dt>
        <dd>
          {material.indicator}, {material.geography}, {material.year}
        </dd>
        {material.backgroundDb && (
          <>
            <dt className="eyebrow">Database</dt>
            <dd>{material.backgroundDb}</dd>
          </>
        )}
      </dl>
      {material.notes && <p className="text-xs leading-relaxed text-muted-foreground">{material.notes}</p>}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (quantity && quantity > 0) onAdd(material, quantity, unit);
        }}
      >
        <label className="min-w-28 flex-1 space-y-1 text-xs text-muted-foreground">
          Quantity
          <NumberInput value={quantity} onChange={setQuantity} placeholder="0" autoFocus />
        </label>
        <label className="w-24 space-y-1 text-xs text-muted-foreground">
          Unit
          <NativeSelect value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className="w-full">
            {units.map((u) => (
              <option key={u} value={u}>
                {unitLabel(u)}
              </option>
            ))}
          </NativeSelect>
        </label>
        <Button type="submit" disabled={!quantity}>
          <Plus />
          Add
        </Button>
      </form>
    </div>
  );
}

function CustomFactorForm({ onAdd }: { onAdd: (material: MaterialFactor, quantity: number, unit: Unit) => void }) {
  const [name, setName] = useState("");
  const [gwp, setGwp] = useState<number | undefined>();
  const [declaredUnit, setDeclaredUnit] = useState<Unit>("kg");
  const [massPerUnitKg, setMass] = useState<number | undefined>();
  const [citation, setCitation] = useState("");
  const [quantity, setQuantity] = useState<number | undefined>();
  const needsMass = !["kg", "t"].includes(declaredUnit);
  const ready = name.trim() && gwp != null && citation.trim() && quantity && (!needsMass || massPerUnitKg);

  return (
    <form
      className="grid gap-3 p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        onAdd(
          {
            id: `user-${crypto.randomUUID()}`,
            name: name.trim(),
            category: "Other",
            declaredUnit,
            gwp: gwp!,
            massPerUnitKg: needsMass ? massPerUnitKg : undefined,
            indicator: "CO2e",
            geography: "As cited",
            year: new Date().getFullYear(),
            quality: "user",
            source: { sourceId: "user", locator: citation.trim() },
          },
          quantity!,
          declaredUnit,
        );
      }}
    >
      <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">
        Material
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Geopolymer binder (lab mix GP-2)" />
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">
        kg CO₂e per declared unit
        <NumberInput value={gwp} onChange={setGwp} placeholder="0" />
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">
        Declared unit
        <NativeSelect value={declaredUnit} onChange={(e) => setDeclaredUnit(e.target.value as Unit)} className="w-full">
          {MATERIAL_UNITS.map((u) => (
            <option key={u} value={u}>
              {unitLabel(u)}
            </option>
          ))}
        </NativeSelect>
      </label>
      {needsMass && (
        <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">
          Mass of one {unitLabel(declaredUnit)} in kg (for transport and end of life)
          <NumberInput value={massPerUnitKg} onChange={setMass} placeholder="0" />
        </label>
      )}
      <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">
        Source (author, year, table/page or DOI)
        <Input value={citation} onChange={(e) => setCitation(e.target.value)} placeholder="Author et al. (2023), Table 4, doi:…" />
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">
        Quantity in this project ({unitLabel(declaredUnit)})
        <NumberInput value={quantity} onChange={setQuantity} placeholder="0" />
      </label>
      <div className="flex items-end">
        <Button type="submit" disabled={!ready} className="w-full">
          <Plus />
          Add your factor
        </Button>
      </div>
    </form>
  );
}
