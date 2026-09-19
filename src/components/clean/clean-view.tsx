"use client";

import { useState } from "react";
import { Download, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/clean/file-dropzone";
import { DataPreviewTable } from "@/components/clean/data-preview-table";
import { CleaningReport } from "@/components/clean/cleaning-report";
import { parseFile } from "@/lib/cleaning/parse-file";
import { CleaningPipeline } from "@/lib/cleaning/pipeline";
import { downloadCsv, generateCsv } from "@/lib/cleaning/generate-csv";
import type { RawRow } from "@/lib/domain/cleaning-rule";
import type { CleaningReport as CleaningReportData } from "@/lib/cleaning/pipeline";

interface CleanedResult {
  fileName: string;
  columns: string[];
  rawRows: RawRow[];
  cleanedRows: RawRow[];
  report: CleaningReportData;
}

export function CleanView() {
  const [result, setResult] = useState<CleanedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setIsProcessing(true);
    setError(null);
    try {
      const { rows, columns } = await parseFile(file);
      const pipeline = new CleaningPipeline();
      const { rows: cleanedRows, report } = pipeline.run(rows);
      setResult({ fileName: file.name, columns, rawRows: rows, cleanedRows, report });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not read that file. Try a CSV or Excel file.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const csv = generateCsv(result.cleanedRows, result.columns);
    const base = result.fileName.replace(/\.[^.]+$/, "");
    downloadCsv(`${base}-cleaned.csv`, csv);
  }

  if (!result) {
    return (
      <div className="flex flex-col gap-4">
        <FileDropzone onFile={handleFile} disabled={isProcessing} />
        {isProcessing && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Parsing file…
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{result.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {result.rawRows.length} rows parsed
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload}>
            <Download />
            Download cleaned CSV
          </Button>
          <Button variant="outline" onClick={() => setResult(null)}>
            <RotateCcw />
            Start over
          </Button>
        </div>
      </div>

      <CleaningReport report={result.report} />

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Raw data preview</h2>
        <DataPreviewTable rows={result.rawRows} columns={result.columns} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Cleaned data preview</h2>
        <DataPreviewTable rows={result.cleanedRows} columns={result.columns} />
      </div>
    </div>
  );
}
