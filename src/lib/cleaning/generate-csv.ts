import Papa from "papaparse";
import type { RawRow } from "@/lib/domain/cleaning-rule";

export function generateCsv(rows: RawRow[], columns: string[]): string {
  return Papa.unparse(rows, { columns });
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
