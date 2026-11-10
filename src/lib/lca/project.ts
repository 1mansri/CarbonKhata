import type { Project, ProjectScope } from "@/lib/lca/types";
import { isUnit } from "@/lib/lca/units";

export function newId(): string {
  return crypto.randomUUID();
}

export const DEFAULT_SCOPE: ProjectScope = {
  goal: "",
  functionalUnit: "",
  boundary: { a4: true, a5: true, c: false, d: false },
};

export function createProject(
  overrides: Partial<Omit<Project, "schemaVersion" | "id">> = {},
): Project {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: newId(),
    name: "Untitled project",
    createdAt: now,
    updatedAt: now,
    scope: DEFAULT_SCOPE,
    items: [],
    siteEnergy: [],
    ...overrides,
  };
}

/** A copy with fresh ids, for "duplicate as alternative" and templates. */
export function cloneProject(project: Project, name: string): Project {
  return createProject({
    name,
    scope: structuredClone(project.scope),
    items: project.items.map((item) => ({ ...structuredClone(item), id: newId() })),
    siteEnergy: project.siteEnergy.map((e) => ({ ...structuredClone(e), id: newId() })),
  });
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
 * Validates an imported project file. Checks the structure the engine
 * relies on; anything else in the file is carried along untouched.
 * Throws with a message that says what's wrong.
 */
export function parseProjectFile(text: string): Project {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON.");
  }
  if (!isObj(data) || data.schemaVersion !== 1) {
    throw new Error("This isn't a Cradle project file (schemaVersion 1).");
  }
  if (typeof data.name !== "string" || !isObj(data.scope) || !Array.isArray(data.items)) {
    throw new Error("The project file is missing its name, scope or inventory.");
  }
  const b = data.scope.boundary;
  if (!isObj(b) || !["a4", "a5", "c", "d"].every((k) => typeof b[k] === "boolean")) {
    throw new Error("The project's system boundary is missing or invalid.");
  }
  const nonNeg = (v: unknown) => v === undefined || (isNum(v) && v >= 0);
  data.items.forEach((item, i) => {
    const line = `Inventory line ${i + 1}`;
    if (!isObj(item) || !isNum(item.quantity) || item.quantity < 0 || !isUnit(item.unit)) {
      throw new Error(`${line} has no valid quantity or unit.`);
    }
    const m = item.material;
    if (!isObj(m) || !isNum(m.gwp) || !isUnit(m.declaredUnit) || !isObj(m.source) || !nonNeg(m.massPerUnitKg)) {
      throw new Error(`${line} has no valid factor.`);
    }
    const t = item.transport;
    if (t !== undefined && (!isObj(t) || !nonNeg(t.distanceKm) || !nonNeg(t.payloadT) || !isObj(t.factor) || !isNum(t.factor.value))) {
      throw new Error(`${line} has invalid transport.`);
    }
    if (!nonNeg(item.wastagePct) || (isNum(item.wastagePct) && item.wastagePct > 100)) {
      throw new Error(`${line} has a wastage outside 0–100%.`);
    }
  });
  const siteEnergy = Array.isArray(data.siteEnergy) ? data.siteEnergy : [];
  siteEnergy.forEach((e, i) => {
    if (!isObj(e) || !isNum(e.quantity) || e.quantity < 0 || !isObj(e.factor) || !isNum(e.factor.value)) {
      throw new Error(`Site energy line ${i + 1} is invalid.`);
    }
  });

  const project = data as unknown as Project;
  // Imported projects get a new id so they never overwrite an existing one.
  return { ...project, id: newId(), siteEnergy: project.siteEnergy ?? [] };
}
