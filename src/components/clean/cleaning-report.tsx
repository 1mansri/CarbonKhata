import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CleaningReport as CleaningReportData } from "@/lib/cleaning/pipeline";

const NOTES_SHOWN = 25;

export function CleaningReport({ report }: { report: CleaningReportData }) {
  const rowsRemoved = report.rowsIn - report.rowsOut;
  const missingCount = report.notes.filter((n) =>
    n.message.startsWith("Missing value"),
  ).length;

  const stats = [
    { label: "Rows in", value: report.rowsIn },
    { label: "Rows out", value: report.rowsOut },
    { label: "Duplicate rows removed", value: rowsRemoved },
    { label: "Missing values flagged", value: missingCount },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cleaning report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-0.5">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="font-mono text-xl tabular-nums text-foreground">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        {report.notes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Details
            </p>
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-3 text-xs">
              {report.notes.slice(0, NOTES_SHOWN).map((note, i) => (
                <li key={i} className="text-muted-foreground">
                  <span className="font-mono text-foreground">
                    row {note.rowIndex + 1}
                  </span>{" "}
                  — {note.message}
                </li>
              ))}
              {report.notes.length > NOTES_SHOWN && (
                <li className="pt-1 text-muted-foreground">
                  +{report.notes.length - NOTES_SHOWN} more
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
