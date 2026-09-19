import type {
  CleaningRule,
  CleaningRuleResult,
  RawRow,
} from "@/lib/domain/cleaning-rule";

/**
 * Flags missing cells without guessing a fill value — silently inventing
 * numbers in an LCA dataset would be worse than leaving a gap visible.
 */
export class FlagMissingValuesRule implements CleaningRule {
  readonly name = "Flag missing values";

  apply(rows: RawRow[]): CleaningRuleResult {
    const notes: CleaningRuleResult["notes"] = [];

    rows.forEach((row, rowIndex) => {
      for (const [column, value] of Object.entries(row)) {
        if (value === null || value === undefined || value === "") {
          notes.push({
            rowIndex,
            column,
            message: `Missing value in "${column}"`,
          });
        }
      }
    });

    return { rows, notes };
  }
}
