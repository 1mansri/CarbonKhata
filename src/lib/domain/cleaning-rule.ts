/** A single row from an uploaded CSV/XLSX, keyed by column header. */
export type RawRow = Record<string, string | number | null | undefined>;

export interface CleaningNote {
  rowIndex: number;
  column?: string;
  message: string;
}

export interface CleaningRuleResult {
  rows: RawRow[];
  notes: CleaningNote[];
}

/**
 * One cleaning behavior (trim, dedupe, unit normalization, ...). The
 * cleaning pipeline runs a list of these in order — adding a new rule means
 * adding a new class, not editing the pipeline (open/closed).
 */
export interface CleaningRule {
  readonly name: string;
  apply(rows: RawRow[]): CleaningRuleResult;
}
