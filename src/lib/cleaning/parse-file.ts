import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { RawRow } from "@/lib/domain/cleaning-rule";

export interface ParsedFile {
  rows: RawRow[];
  columns: string[];
}

function isSpreadsheet(file: File): boolean {
  return /\.xlsx?$/i.test(file.name);
}

function parseCsv(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          rows: results.data,
          columns: results.meta.fields ?? [],
        });
      },
      error: (error: Error) => reject(error),
    });
  });
}

async function parseSpreadsheet(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: "",
    raw: false,
  });
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { rows, columns };
}

export function parseFile(file: File): Promise<ParsedFile> {
  return isSpreadsheet(file) ? parseSpreadsheet(file) : parseCsv(file);
}
