import { calculateProject } from "@/lib/lca/calculate";
import type { Project } from "@/lib/lca/types";

export interface UncertaintyResult {
  runs: number;
  seed: number;
  mean: number;
  p2_5: number;
  p50: number;
  p97_5: number;
  /** Share of the deterministic total whose factors carry a published range. */
  coverage: number;
  samples: number[];
}

type Perturb = (value: number, low?: number, high?: number) => number;

/** Copy of the project with every ranged factor value replaced by `perturb`. */
function mapRangedFactors(project: Project, perturb: Perturb): Project {
  return {
    ...project,
    items: project.items.map((item) => ({
      ...item,
      material: {
        ...item.material,
        gwp: perturb(item.material.gwp, item.material.low, item.material.high),
      },
      transport: item.transport && {
        ...item.transport,
        factor: {
          ...item.transport.factor,
          value: perturb(
            item.transport.factor.value,
            item.transport.factor.low,
            item.transport.factor.high,
          ),
        },
      },
    })),
    siteEnergy: project.siteEnergy.map((energy) => ({
      ...energy,
      factor: {
        ...energy.factor,
        value: perturb(energy.factor.value, energy.factor.low, energy.factor.high),
      },
    })),
  };
}

const hasRange = (low?: number, high?: number) => low != null && high != null && high > low;

/** Small, fast, seedable PRNG so runs are reproducible (same seed → same result). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inverse-CDF sample of a triangular(low, mode, high) distribution. */
export function triangular(u: number, low: number, mode: number, high: number): number {
  const c = (mode - low) / (high - low);
  return u < c
    ? low + Math.sqrt(u * (high - low) * (mode - low))
    : high - Math.sqrt((1 - u) * (high - low) * (high - mode));
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * Monte Carlo over factor uncertainty: each factor with a published
 * low/high range is drawn from a triangular distribution with its central
 * value as the mode. Quantities are treated as exact. Factors without a
 * range stay fixed — `coverage` says how much of the total that leaves out.
 */
export function runMonteCarlo(project: Project, runs = 5000, seed = 42): UncertaintyResult {
  const deterministic = calculateProject(project).total;
  const unranged = calculateProject(
    mapRangedFactors(project, (value, low, high) => (hasRange(low, high) ? 0 : value)),
  ).total;

  const rand = mulberry32(seed);
  const samples: number[] = [];
  for (let i = 0; i < runs; i++) {
    const sampled = mapRangedFactors(project, (value, low, high) =>
      hasRange(low, high) ? triangular(rand(), low!, value, high!) : value,
    );
    samples.push(calculateProject(sampled).total);
  }

  const sorted = [...samples].sort((a, b) => a - b);
  return {
    runs,
    seed,
    mean: samples.reduce((s, v) => s + v, 0) / runs,
    p2_5: quantile(sorted, 0.025),
    p50: quantile(sorted, 0.5),
    p97_5: quantile(sorted, 0.975),
    coverage: deterministic > 0 ? (deterministic - unranged) / deterministic : 0,
    samples,
  };
}
