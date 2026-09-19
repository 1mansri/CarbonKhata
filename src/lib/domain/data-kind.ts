/**
 * What kind of data a source actually provides. Neither kind is a full
 * multi-category LCA impact assessment (GWP + acidification + eutrophication
 * + water use + ...) — that data isn't available as a free live API (see
 * README). This classification exists so the UI never lets that be
 * mistaken.
 */
export type DataKind = "regulatory-monitoring" | "emission-factor";

export const DATA_KIND_META: Record<
  DataKind,
  { label: string; description: string }
> = {
  "regulatory-monitoring": {
    label: "Monitoring",
    description: "Ambient monitoring data, not an LCA impact indicator.",
  },
  "emission-factor": {
    label: "Emission factor",
    description: "One GHG indicator (CO2e), not a full LCA impact set.",
  },
};
