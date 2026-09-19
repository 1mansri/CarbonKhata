import type { Activity } from "@/lib/domain/types";

const CSV_COLUMNS = [
  "activity_name",
  "category",
  "sector",
  "activity_unit",
  "geography",
  "reference_year",
  "source",
  "indicator_name",
  "value",
  "indicator_unit",
  "method",
] as const;

function csvEscape(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * Formats Activity data for download. One row per indicator (tidy/long
 * format) so the CSV loads cleanly into pandas/Excel for further analysis.
 */
export class ExportService {
  toCsv(activities: Activity[]): string {
    const lines = [CSV_COLUMNS.join(",")];

    for (const activity of activities) {
      const base = [
        activity.name,
        activity.category,
        activity.sector,
        activity.unit,
        activity.geography,
        activity.referenceYear,
        activity.sourceName,
      ];

      if (activity.indicators.length === 0) {
        lines.push([...base, "", "", "", ""].map(csvEscape).join(","));
        continue;
      }

      for (const indicator of activity.indicators) {
        lines.push(
          [
            ...base,
            indicator.indicatorName,
            indicator.value,
            indicator.unit,
            indicator.method,
          ]
            .map(csvEscape)
            .join(","),
        );
      }
    }

    return lines.join("\n");
  }

  toJson(activities: Activity[]): string {
    return JSON.stringify(activities, null, 2);
  }
}
