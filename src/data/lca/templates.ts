import { VALIDATION_CASES } from "@/data/lca/validation";
import type { Project } from "@/lib/lca/types";

/**
 * Worked examples a scholar can open and modify. Each one reproduces a
 * published study, built from that study's own inventory and factors.
 */
export interface Template {
  id: string;
  title: string;
  summary: string;
  /** Short citation of the study this reproduces. */
  basedOn?: string;
  build: () => Omit<Project, "schemaVersion" | "id" | "createdAt" | "updatedAt">;
}

export const TEMPLATES: Template[] = VALIDATION_CASES.map((c) => ({
  id: c.id,
  title: c.title,
  summary:
    "A published building study rebuilt line by line. Material production (A1–A3) and site work (A5) match the paper exactly; its truck transport (A4, 24.6 t) is left out.",
  basedOn: c.citation,
  build: c.build,
}));
