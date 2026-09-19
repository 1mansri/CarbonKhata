import type {
  CleaningNote,
  CleaningRule,
  RawRow,
} from "@/lib/domain/cleaning-rule";
import { TrimWhitespaceRule } from "@/lib/cleaning/rules/trim-whitespace-rule";
import { NormalizeUnitsRule } from "@/lib/cleaning/rules/normalize-units-rule";
import { DedupeExactRowsRule } from "@/lib/cleaning/rules/dedupe-exact-rows-rule";
import { FlagMissingValuesRule } from "@/lib/cleaning/rules/flag-missing-values-rule";

export interface RuleSummary {
  rule: string;
  noteCount: number;
}

export interface CleaningReport {
  rowsIn: number;
  rowsOut: number;
  notes: CleaningNote[];
  ruleBreakdown: RuleSummary[];
}

export interface CleaningPipelineResult {
  rows: RawRow[];
  report: CleaningReport;
}

/**
 * The default cleaning pipeline. Order matters: trim before comparing
 * values, normalize units before dedup so near-duplicates collapse, dedupe
 * before the final missing-value flag pass so it reports on what's left.
 */
export function defaultCleaningRules(): CleaningRule[] {
  return [
    new TrimWhitespaceRule(),
    new NormalizeUnitsRule(),
    new DedupeExactRowsRule(),
    new FlagMissingValuesRule(),
  ];
}

export class CleaningPipeline {
  constructor(private readonly rules: CleaningRule[] = defaultCleaningRules()) {}

  run(rows: RawRow[]): CleaningPipelineResult {
    let current = rows;
    const notes: CleaningNote[] = [];
    const ruleBreakdown: RuleSummary[] = [];

    for (const rule of this.rules) {
      const result = rule.apply(current);
      current = result.rows;
      notes.push(...result.notes);
      ruleBreakdown.push({ rule: rule.name, noteCount: result.notes.length });
    }

    return {
      rows: current,
      report: {
        rowsIn: rows.length,
        rowsOut: current.length,
        notes,
        ruleBreakdown,
      },
    };
  }
}
