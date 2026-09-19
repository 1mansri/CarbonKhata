import type { ActivityData, DataSourceInfo } from "@/lib/domain/types";

/**
 * Contract every data source (data.gov.in/CPCB, DEFRA, CEA, ...) implements.
 * Adding a new source means writing a new adapter — nothing that consumes
 * `DataSourceAdapter` needs to change (open/closed).
 */
export interface DataSourceAdapter {
  readonly info: DataSourceInfo;

  /** Fetch raw records from this source (HTTP call, or read a local file). */
  fetch(): Promise<unknown[]>;

  /** Map a source's raw record shape into the common ActivityData shape. */
  normalize(raw: unknown[]): ActivityData[];
}
