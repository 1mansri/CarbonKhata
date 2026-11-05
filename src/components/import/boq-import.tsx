"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { FileDropzone } from "@/components/clean/file-dropzone";
import { MATERIALS, getMaterial } from "@/data/lca/materials";
import { parseFile } from "@/lib/cleaning/parse-file";
import { CleaningPipeline } from "@/lib/cleaning/pipeline";
import { detectColumns, matchBoq, type BoqLine } from "@/lib/lca/boq";
import { fmt } from "@/lib/lca/format";
import { createProject, newId } from "@/lib/lca/project";
import { getProject, saveProject, useProjects } from "@/lib/lca/project-store";
import { compatibleUnits, unitLabel } from "@/lib/lca/units";
import type { InventoryItem } from "@/lib/lca/types";

interface Review extends BoqLine {
  materialId: string | "";
}

export function BoqImport() {
  const router = useRouter();
  const projects = useProjects();
  const [fileName, setFileName] = useState<string | null>(null);
  const [lines, setLines] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<string>("new");

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const { rows, columns } = await parseFile(file);
      const { rows: cleaned } = new CleaningPipeline().run(rows);
      const cols = detectColumns(columns);
      if (!cols.description || !cols.quantity) {
        throw new Error(`Couldn't find description and quantity columns. Found: ${columns.join(", ")}.`);
      }
      setFileName(file.name);
      setLines(
        matchBoq(cleaned, cols, MATERIALS).map((l) => ({
          ...l,
          // Weak matches are left for the reader to decide.
          materialId: l.match && l.confidence >= 0.35 ? l.match.id : "",
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file. Use CSV or Excel.");
    } finally {
      setBusy(false);
    }
  }

  const usable = (lines ?? []).filter((l) => {
    const m = l.materialId ? getMaterial(l.materialId) : undefined;
    return m && l.quantity != null && l.quantity > 0 && l.unit && compatibleUnits(m).includes(l.unit.unit);
  });

  function addToProject() {
    const items: InventoryItem[] = usable.map((l) => ({
      id: newId(),
      label: l.text,
      material: getMaterial(l.materialId)!,
      quantity: l.quantity! * l.unit!.factor,
      unit: l.unit!.unit,
    }));
    const base =
      target === "new" ? createProject({ name: fileName?.replace(/\.[^.]+$/, "") ?? "Imported BoQ" }) : getProject(target);
    if (!base) return;
    const next = { ...base, items: [...base.items, ...items] };
    saveProject(next);
    router.push(`/project/${next.id}`);
  }

  if (!lines) {
    return (
      <div className="space-y-3">
        <FileDropzone onFile={handleFile} disabled={busy} />
        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Reading file…
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Needs a description and a quantity column; a unit column is read if present (cum, sqm, MT, qtl, bags, nos).
          The file is read in your browser and never uploaded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto text-sm">
          <span className="font-medium">{fileName}</span>
          <span className="text-muted-foreground">
            {" "}
            {usable.length} of {lines.length} rows ready
          </span>
        </p>
        <Button variant="ghost" onClick={() => setLines(null)}>
          <RotateCcw />
          Another file
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">BoQ item</th>
              <th className="px-3 py-2 text-right font-medium">Quantity</th>
              <th className="px-3 py-2 font-medium">Library material</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const m = l.materialId ? getMaterial(l.materialId) : undefined;
              const unitOk = !m || (l.unit && compatibleUnits(m).includes(l.unit.unit));
              return (
                <tr key={i} className="border-b border-border/60 align-top last:border-b-0">
                  <td className="px-3 py-2">{l.text}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {l.quantity == null ? (
                      <span className="text-warning">missing</span>
                    ) : (
                      <>
                        {fmt(l.quantity)} {l.rawUnit}
                        {l.unit && l.unit.factor !== 1 && (
                          <div className="text-xs text-muted-foreground">
                            = {fmt(l.quantity * l.unit.factor)} {unitLabel(l.unit.unit)}
                          </div>
                        )}
                        {!l.unit && <div className="text-xs text-warning">unit not recognised</div>}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <NativeSelect
                      aria-label={`Material for ${l.text}`}
                      className="w-full min-w-56"
                      value={l.materialId}
                      onChange={(e) =>
                        setLines((cur) => cur!.map((x, j) => (j === i ? { ...x, materialId: e.target.value } : x)))
                      }
                    >
                      <option value="">Skip this row</option>
                      {MATERIALS.map((mat) => (
                        <option key={mat.id} value={mat.id}>
                          {mat.name}
                        </option>
                      ))}
                    </NativeSelect>
                    {m && !unitOk && (
                      <p className="mt-1 text-xs text-warning">
                        {l.rawUnit || "This unit"} can&apos;t be converted for this factor (needs{" "}
                        {compatibleUnits(m).map(unitLabel).join(", ")}).
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <NativeSelect aria-label="Add to project" value={target} onChange={(e) => setTarget(e.target.value)} className="w-64">
          <option value="new">New project</option>
          {Object.values(projects ?? {}).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
        <Button disabled={usable.length === 0} onClick={addToProject}>
          Add {usable.length} line{usable.length === 1 ? "" : "s"} to the ledger
        </Button>
      </div>
    </div>
  );
}
