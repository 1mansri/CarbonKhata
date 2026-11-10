"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { NumberInput } from "@/components/ui/number-input";
import { MaterialPicker } from "@/components/project/material-picker";
import { QualityBadge } from "@/components/project/quality-badge";
import { TRANSPORT_FACTORS } from "@/data/lca/transport";
import { eolOptions } from "@/data/lca/end-of-life";
import { getSource } from "@/data/lca/sources";
import { fmt } from "@/lib/lca/format";
import { newId } from "@/lib/lca/project";
import { MODULE_META } from "@/lib/lca/quality";
import { compatibleUnits, unitLabel } from "@/lib/lca/units";
import type { InventoryItem, ItemResult, Project, ProjectResult, Unit } from "@/lib/lca/types";
import { cn } from "@/lib/utils";

type Update = (change: (p: Project) => Project) => void;

/**
 * Phone: two lines per entry (material + delete, then quantity + total).
 * md and up: one ledger line with a running balance column.
 */
const ROW_GRID =
  "grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 md:grid-cols-[1.75rem_minmax(0,1fr)_11rem_7rem_7rem_2rem]";

export function Ledger({
  project,
  result,
  update,
}: {
  project: Project;
  result: ProjectResult;
  update: Update;
}) {
  // An empty project leads with the AI description box; the picker opens on demand.
  const [picking, setPicking] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const setItem = (id: string, change: (item: InventoryItem) => InventoryItem) =>
    update((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? change(i) : i)) }));

  // Running balance down the ledger, like a khata's last column.
  const balances = result.items.map((_, i) =>
    result.items.slice(0, i + 1).reduce((sum, r) => sum + r.total, 0),
  );

  return (
    <div className="space-y-4">
      {project.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className={cn(ROW_GRID, "condensed hidden border-b border-border py-2 text-xs font-semibold text-muted-foreground md:grid")}>
            <span>#</span>
            <span>Material</span>
            <span className="text-right">Quantity</span>
            <span className="text-right">kg CO₂e</span>
            <span className="text-right">Balance</span>
            <span />
          </div>
          <ol>
            {project.items.map((item, index) => {
              const r = result.items[index];
              const balance = balances[index];
              const expanded = open === item.id;
              return (
                <li key={item.id} className="border-b border-border last:border-b-0">
                  <div className={cn(ROW_GRID, "py-2.5")}>
                    <span className="tabular text-xs text-muted-foreground">{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : item.id)}
                      aria-expanded={expanded}
                      className="group col-start-2 row-start-1 flex min-w-0 items-center gap-2 text-left md:col-auto md:row-auto"
                    >
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-(--ease-out)",
                          expanded && "rotate-180",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium group-hover:text-primary">{r.label}</span>
                        <RowChips item={item} result={r} />
                      </span>
                    </button>
                    <div className="col-start-2 row-start-2 flex items-center gap-1.5 md:col-auto md:row-auto">
                      <NumberInput
                        aria-label={`Quantity of ${r.label}`}
                        value={item.quantity}
                        // An edited quantity is the user's own, no longer an AI estimate.
                        onChange={(q) => q != null && setItem(item.id, (i) => ({ ...i, quantity: q, aiBasis: undefined }))}
                      />
                      <NativeSelect
                        aria-label="Unit"
                        value={item.unit}
                        onChange={(e) => setItem(item.id, (i) => ({ ...i, unit: e.target.value as Unit }))}
                        className="w-[4.5rem] shrink-0"
                      >
                        {compatibleUnits(item.material).map((u) => (
                          <option key={u} value={u}>
                            {unitLabel(u)}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                    <span className="tabular col-start-3 row-start-2 text-right text-sm font-medium md:col-auto md:row-auto">
                      {fmt(r.total)}
                    </span>
                    <span className="tabular hidden text-right text-sm text-muted-foreground md:block">{fmt(balance)}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="col-start-3 row-start-1 justify-self-end md:col-auto md:row-auto"
                      aria-label={`Remove ${r.label}`}
                      onClick={() => update((p) => ({ ...p, items: p.items.filter((i) => i.id !== item.id) }))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  {expanded && (
                    <ItemDetails item={item} result={r} boundary={project.scope.boundary} setItem={setItem} />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {picking ? (
        <MaterialPicker
          onClose={() => setPicking(false)}
          onAdd={(material, quantity, unit) => {
            update((p) => ({ ...p, items: [...p.items, { id: newId(), material, quantity, unit }] }));
            setPicking(false);
          }}
        />
      ) : (
        <Button variant="outline" onClick={() => setPicking(true)}>
          <Plus />
          Add material
        </Button>
      )}
    </div>
  );
}

function RowChips({ item, result }: { item: InventoryItem; result: ItemResult }) {
  const chips: string[] = [];
  if (item.transport?.distanceKm) chips.push(`${fmt(item.transport.distanceKm)} km`);
  if (item.wastagePct) chips.push(`${fmt(item.wastagePct)}% waste`);
  if (item.endOfLife) chips.push(item.endOfLife.kind === "epd" ? "EPD end of life" : item.endOfLife.factor.route);
  return (
    <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
      <QualityBadge quality={item.material.quality} />
      {item.aiBasis !== undefined && (
        <span className="text-xs font-medium text-warning" title={item.aiBasis || "Quantity drafted by AI"}>
          AI quantity
        </span>
      )}
      {chips.map((c) => (
        <span key={c} className="text-xs text-muted-foreground">
          {c}
        </span>
      ))}
      {result.warnings.length > 0 && (
        <span className="text-xs font-medium text-warning">{result.warnings.length} to fix</span>
      )}
    </span>
  );
}

function ItemDetails({
  item,
  result,
  boundary,
  setItem,
}: {
  item: InventoryItem;
  result: ItemResult;
  boundary: Project["scope"]["boundary"];
  setItem: (id: string, change: (item: InventoryItem) => InventoryItem) => void;
}) {
  const transport = item.transport;
  const eol = eolOptions(item.material.eolGroup);
  const source = getSource(item.material.source.sourceId);
  const set = (change: (i: InventoryItem) => InventoryItem) => setItem(item.id, change);

  return (
    <div className="grid gap-5 border-t border-dashed border-border bg-muted/40 px-3 py-4 sm:pl-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <Field label="A4 transport to site" disabled={!boundary.a4}>
          <div className="flex flex-wrap items-center gap-2">
            <NumberInput
              aria-label="Distance in km"
              className="w-20"
              placeholder="km"
              value={transport?.distanceKm || undefined}
              onChange={(d) =>
                // Keep the chosen vehicle and payload while the distance is retyped.
                set((i) => ({
                  ...i,
                  transport: { factor: i.transport?.factor ?? TRANSPORT_FACTORS[0], ...i.transport, distanceKm: d ?? 0 },
                }))
              }
            />
            <span className="text-xs text-muted-foreground">km by</span>
            <NativeSelect
              aria-label="Vehicle"
              className="min-w-0 flex-1"
              value={transport?.factor.id ?? TRANSPORT_FACTORS[0].id}
              onChange={(e) => {
                const factor = TRANSPORT_FACTORS.find((f) => f.id === e.target.value)!;
                set((i) => ({ ...i, transport: { distanceKm: i.transport?.distanceKm ?? 0, ...i.transport, factor } }));
              }}
            >
              {TRANSPORT_FACTORS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          {transport?.factor.basis === "vkm" && (
            <div className="mt-2 flex items-center gap-2">
              <NumberInput
                aria-label="Payload per trip in tonnes"
                className="w-20"
                placeholder="t"
                value={transport.payloadT}
                onChange={(t) => set((i) => ({ ...i, transport: { ...i.transport!, payloadT: t } }))}
              />
              <span className="text-xs text-muted-foreground">t payload per trip (this factor is per vehicle-km)</span>
            </div>
          )}
        </Field>
        <Field label="A5 wastage on site" disabled={!boundary.a5}>
          <div className="flex items-center gap-2">
            <NumberInput
              aria-label="Wastage percent"
              className="w-20"
              placeholder="0"
              value={item.wastagePct}
              onChange={(w) => set((i) => ({ ...i, wastagePct: w }))}
            />
            <span className="text-xs text-muted-foreground">% of installed quantity</span>
          </div>
        </Field>
        <Field label="C1–C4 end of life" disabled={!boundary.c}>
          <NativeSelect
            aria-label="End of life route"
            className="w-full"
            value={item.endOfLife ? (item.endOfLife.kind === "epd" ? "epd" : item.endOfLife.factor.id) : ""}
            onChange={(e) => {
              const v = e.target.value;
              set((i) => ({
                ...i,
                endOfLife:
                  v === "" ? undefined : v === "epd" ? { kind: "epd" } : { kind: "route", factor: eol.find((f) => f.id === v)! },
              }));
            }}
          >
            <option value="">Not assessed</option>
            {item.material.epdEndOfLife?.c1c4 != null && <option value="epd">As declared in the EPD</option>}
            {eol.map((f) => (
              <option key={f.id} value={f.id}>
                {f.route} ({fmt(f.value)} kg CO₂e/t, UK proxy)
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <div className="space-y-3">
        <p className="condensed text-xs font-semibold text-muted-foreground">Working</p>
        <ul className="space-y-1.5">
          {(Object.keys(result.working) as (keyof typeof result.working)[]).map((m) => (
            <li key={m} className="flex gap-2 text-xs leading-relaxed">
              <span
                className="mt-1 size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: MODULE_META[m].color }}
                aria-hidden
              />
              <span>
                <span className="font-medium">{MODULE_META[m].label}</span>{" "}
                <span className="tabular text-muted-foreground">{result.working[m]}</span>
              </span>
            </li>
          ))}
        </ul>
        {result.warnings.map((w) => (
          <p key={w} className="text-xs text-warning">
            {w}
          </p>
        ))}
        <p className="text-xs text-muted-foreground">
          {source?.short}, {item.material.source.locator}
          {item.material.notes ? `. ${item.material.notes}` : ""}
        </p>
      </div>
    </div>
  );
}

function Field({ label, disabled, children }: { label: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <fieldset disabled={disabled} className="space-y-1.5 disabled:opacity-45">
      <legend className="mb-1.5 text-xs font-medium">
        {label}
        {disabled && <span className="ml-1.5 font-normal text-muted-foreground">(outside boundary)</span>}
      </legend>
      {children}
    </fieldset>
  );
}
