"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { NumberInput } from "@/components/ui/number-input";
import { MATERIALS, getMaterial } from "@/data/lca/materials";
import { fmt } from "@/lib/lca/format";
import { createProject, newId } from "@/lib/lca/project";
import { getProject, saveProject, useProjects } from "@/lib/lca/project-store";
import { MATERIAL_UNITS, compatibleUnits, unitLabel } from "@/lib/lca/units";
import type { InventoryItem, ProjectScope, Unit } from "@/lib/lca/types";

/** One row waiting for review, from a BoQ file or an AI draft. */
export interface ReviewLine {
  text: string;
  quantity: number | null;
  /** Unit of `quantity`, and how many calculator units one of it holds. */
  unit: { unit: Unit; factor: number } | null;
  rawUnit: string;
  materialId: string | "";
  /** AI drafts only: the model's stated basis for the quantity. */
  basis?: string;
  /** Quantity added or edited by the user during review: not an AI estimate. */
  manual?: boolean;
}

export function isUsable(l: ReviewLine): boolean {
  const m = l.materialId ? getMaterial(l.materialId) : undefined;
  return !!m && l.quantity != null && l.quantity > 0 && !!l.unit && compatibleUnits(m).includes(l.unit.unit);
}

/** Ledger lines from the reviewed rows; with `ai`, untouched quantities keep their AI mark. */
export function toInventoryItems(lines: ReviewLine[], ai = false): InventoryItem[] {
  return lines.filter(isUsable).map((l) => {
    const material = getMaterial(l.materialId)!;
    return {
      id: newId(),
      label: l.text || material.name,
      material,
      quantity: l.quantity! * l.unit!.factor,
      unit: l.unit!.unit,
      ...(ai && !l.manual ? { aiBasis: l.basis ?? "" } : {}),
    };
  });
}

/** A blank row for a component the reviewer adds by hand. */
export const MANUAL_LINE: ReviewLine = { text: "", quantity: null, unit: null, rawUnit: "", materialId: "", manual: true };

/**
 * The review step shared by BoQ import and AI drafting: every row gets a
 * library material (or is skipped) before it reaches the ledger. With
 * `editable`, quantities and units can be corrected in place.
 */
export function ReviewTable({
  lines,
  onChange,
  itemHeading,
  editable = false,
}: {
  lines: ReviewLine[];
  onChange: (lines: ReviewLine[]) => void;
  itemHeading: string;
  editable?: boolean;
}) {
  const set = (i: number, patch: Partial<ReviewLine>) => onChange(lines.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  // Wide: a table. Narrow (phones, or beside a sidebar): one card per row,
  // so inputs never scroll sideways.
  return (
    <div className="@container rounded-lg border border-border bg-card">
      <table className="w-full text-sm @max-2xl:block">
        <thead className="@max-2xl:hidden">
          <tr className="eyebrow border-b border-border text-left">
            <th className="px-3 py-2 font-medium">{itemHeading}</th>
            <th className="px-3 py-2 text-right font-medium">Quantity</th>
            <th className="px-3 py-2 font-medium">Library material</th>
          </tr>
        </thead>
        <tbody className="enter-stagger @max-2xl:block">
          {lines.map((l, i) => {
            const m = l.materialId ? getMaterial(l.materialId) : undefined;
            const unitOk = !m || (l.unit && compatibleUnits(m).includes(l.unit.unit));
            const unitChoices = m ? compatibleUnits(m) : MATERIAL_UNITS;
            return (
              <tr
                key={i}
                // Rows the reviewer adds appear at once; drafted rows arrive in a quick stagger.
                style={{ "--i": l.manual ? 0 : i } as React.CSSProperties}
                className="border-b border-border/60 align-top last:border-b-0 @max-2xl:grid @max-2xl:gap-2.5 @max-2xl:p-3"
              >
                <td className="px-3 py-2.5 @max-2xl:p-0">
                  <span className="font-medium">
                    {l.text || <span className="font-normal text-muted-foreground">New component: pick a material</span>}
                  </span>
                  {l.basis && (
                    <p className="mt-1 max-w-md font-mono text-2xs leading-relaxed text-muted-foreground">{l.basis}</p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap @max-2xl:p-0 @max-2xl:text-left">
                  {editable ? (
                    <div className="flex items-center justify-end gap-1.5 @max-2xl:justify-start">
                      <NumberInput
                        aria-label={`Quantity of ${l.text || "new component"}`}
                        className="w-28"
                        value={l.quantity ?? undefined}
                        onChange={(q) => set(i, { quantity: q ?? null, manual: true })}
                      />
                      <NativeSelect
                        aria-label={`Unit of ${l.text || "new component"}`}
                        className="w-[4.5rem]"
                        value={l.unit?.unit ?? ""}
                        onChange={(e) => {
                          const u = e.target.value as Unit;
                          set(i, { unit: { unit: u, factor: 1 }, rawUnit: unitLabel(u) });
                        }}
                      >
                        {!l.unit && <option value="">unit</option>}
                        {unitChoices.map((u) => (
                          <option key={u} value={u}>
                            {unitLabel(u)}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  ) : l.quantity == null ? (
                    <span className="text-warning">Quantity missing</span>
                  ) : (
                    <span className="tabular">
                      {fmt(l.quantity)} {l.rawUnit}
                      {l.unit && l.unit.factor !== 1 && (
                        <span className="block text-xs text-muted-foreground">
                          = {fmt(l.quantity * l.unit.factor)} {unitLabel(l.unit.unit)}
                        </span>
                      )}
                      {!l.unit && <span className="block text-xs text-warning">Unit not recognised</span>}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 @max-2xl:p-0">
                  <NativeSelect
                    aria-label={`Material for ${l.text || "new component"}`}
                    className="w-full @2xl:min-w-56"
                    value={l.materialId}
                    onChange={(e) => set(i, { materialId: e.target.value })}
                  >
                    <option value="">{editable ? "No match: skip this line" : "Skip this row"}</option>
                    {MATERIALS.map((mat) => (
                      <option key={mat.id} value={mat.id}>
                        {mat.name}
                      </option>
                    ))}
                  </NativeSelect>
                  {m && !unitOk && (
                    <p className="mt-1 text-xs text-warning">
                      {l.rawUnit || "This unit"} doesn&apos;t fit this factor. Use {compatibleUnits(m).map(unitLabel).join(", ")}.
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Target picker + "add to ledger" for reviewed lines. */
export function AddToProject({
  lines,
  newName,
  scope,
  ai,
}: {
  lines: ReviewLine[];
  newName: string;
  /** Scope for a new project (an existing project keeps its own). */
  scope?: Partial<ProjectScope>;
  /** Mark the lines as AI-estimated quantities. */
  ai?: boolean;
}) {
  const router = useRouter();
  const projects = useProjects();
  const [target, setTarget] = useState<string>("new");
  const usable = lines.filter(isUsable);

  function add() {
    const items = toInventoryItems(lines, ai);
    const base =
      target === "new"
        ? createProject({ name: newName, ...(scope ? { scope: { ...createProject().scope, ...scope } } : {}) })
        : getProject(target);
    if (!base) return;
    const next = { ...base, items: [...base.items, ...items] };
    saveProject(next);
    router.push(`/project/${next.id}`);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
      <NativeSelect
        aria-label="Add to project"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="w-full sm:w-64"
      >
        <option value="new">New project</option>
        {Object.values(projects ?? {}).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </NativeSelect>
      <Button disabled={usable.length === 0} onClick={add} className="h-9 sm:h-8">
        Add {usable.length} line{usable.length === 1 ? "" : "s"} to the ledger
      </Button>
    </div>
  );
}
