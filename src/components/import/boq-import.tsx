"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/clean/file-dropzone";
import { AddToProject, ReviewTable, isUsable, type ReviewLine } from "@/components/import/review-table";
import { MATERIALS } from "@/data/lca/materials";
import { parseFile } from "@/lib/cleaning/parse-file";
import { CleaningPipeline } from "@/lib/cleaning/pipeline";
import { detectColumns, matchBoq } from "@/lib/lca/boq";

export function BoqImport() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [lines, setLines] = useState<ReviewLine[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
          text: l.text,
          quantity: l.quantity,
          unit: l.unit,
          rawUnit: l.rawUnit,
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
            {lines.filter(isUsable).length} of {lines.length} rows ready
          </span>
        </p>
        <Button variant="ghost" onClick={() => setLines(null)}>
          <RotateCcw />
          Another file
        </Button>
      </div>
      <ReviewTable lines={lines} onChange={setLines} itemHeading="BoQ item" />
      <AddToProject lines={lines} newName={fileName?.replace(/\.[^.]+$/, "") ?? "Imported BoQ"} />
    </div>
  );
}
