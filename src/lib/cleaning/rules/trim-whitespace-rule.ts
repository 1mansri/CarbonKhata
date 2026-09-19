import type {
  CleaningRule,
  CleaningRuleResult,
  RawRow,
} from "@/lib/domain/cleaning-rule";

export class TrimWhitespaceRule implements CleaningRule {
  readonly name = "Trim whitespace";

  apply(rows: RawRow[]): CleaningRuleResult {
    const notes: CleaningRuleResult["notes"] = [];

    const cleaned = rows.map((row, rowIndex) => {
      const next: RawRow = { ...row };
      for (const [column, value] of Object.entries(row)) {
        if (typeof value !== "string") continue;
        const trimmed = value.trim().replace(/\s+/g, " ");
        if (trimmed !== value) {
          next[column] = trimmed;
          notes.push({
            rowIndex,
            column,
            message: `Trimmed extra whitespace in "${column}"`,
          });
        }
      }
      return next;
    });

    return { rows: cleaned, notes };
  }
}
