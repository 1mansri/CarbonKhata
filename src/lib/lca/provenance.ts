import { calculateEnergy, calculateItem } from "@/lib/lca/calculate";
import type { DataQuality, Project } from "@/lib/lca/types";

/**
 * Splits the project total by the data-quality tag of the factor that
 * produced each kilogram, answering "how much of this number rests on
 * Indian data, and how much on proxies?". On-site wastage (A5) inherits the
 * tags of the A1–A3 and A4 factors it scales.
 */
export function provenanceShares(project: Project): Map<DataQuality, number> {
  const shares = new Map<DataQuality, number>();
  const add = (q: DataQuality, kg: number) => {
    if (kg !== 0) shares.set(q, (shares.get(q) ?? 0) + kg);
  };
  const { boundary } = project.scope;

  for (const item of project.items) {
    const r = calculateItem(item, boundary);
    const wasteShare = boundary.a5 && item.wastagePct ? item.wastagePct / 100 : 0;
    add(item.material.quality, r.modules["A1-A3"] * (1 + wasteShare));
    if (item.transport) add(item.transport.factor.quality, r.modules.A4 * (1 + wasteShare));
    if (item.endOfLife) {
      add(
        item.endOfLife.kind === "epd" ? item.material.quality : item.endOfLife.factor.quality,
        r.modules["C1-C4"],
      );
    }
  }
  if (boundary.a5) {
    for (const energy of project.siteEnergy) add(energy.factor.quality, calculateEnergy(energy).value);
  }
  return shares;
}
