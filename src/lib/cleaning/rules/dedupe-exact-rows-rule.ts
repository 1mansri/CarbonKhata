import type {
  CleaningRule,
  CleaningRuleResult,
  RawRow,
} from "@/lib/domain/cleaning-rule";

export class DedupeExactRowsRule implements CleaningRule {
  readonly name = "Remove duplicate rows";

  apply(rows: RawRow[]): CleaningRuleResult {
    const seen = new Set<string>();
    const notes: CleaningRuleResult["notes"] = [];
    const kept: RawRow[] = [];

    rows.forEach((row, rowIndex) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        notes.push({ rowIndex, message: "Removed exact duplicate row" });
        return;
      }
      seen.add(key);
      kept.push(row);
    });

    return { rows: kept, notes };
  }
}
