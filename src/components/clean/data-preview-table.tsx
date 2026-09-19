import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RawRow } from "@/lib/domain/cleaning-rule";

const PREVIEW_ROWS = 10;

export function DataPreviewTable({
  rows,
  columns,
}: {
  rows: RawRow[];
  columns: string[];
}) {
  const preview = rows.slice(0, PREVIEW_ROWS);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column} className="whitespace-nowrap">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.map((row, i) => (
            <TableRow key={i}>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  className="whitespace-nowrap font-mono text-xs"
                >
                  {row[column] ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > PREVIEW_ROWS && (
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Showing {PREVIEW_ROWS} of {rows.length} rows.
        </p>
      )}
    </div>
  );
}
