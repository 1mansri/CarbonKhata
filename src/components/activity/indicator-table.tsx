import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ImpactIndicatorData } from "@/lib/domain/types";

export function IndicatorTable({
  indicators,
}: {
  indicators: ImpactIndicatorData[];
}) {
  if (indicators.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No indicators recorded for this activity yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Indicator</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Method</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {indicators.map((indicator, i) => (
            <TableRow key={`${indicator.indicatorName}-${i}`}>
              <TableCell className="font-medium">
                {indicator.indicatorName}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {indicator.value}
              </TableCell>
              <TableCell className="font-mono text-muted-foreground">
                {indicator.unit}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {indicator.method ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
