import type { MaterialFactor, Unit } from "@/lib/lca/types";
import type { Assembly } from "@/data/lca/assemblies";
import { MATERIAL_UNITS, isUnit } from "@/lib/lca/units";

/**
 * AI drafting of an inventory from a one-line description ("230 mm brick
 * wall, 10 m²").
 *
 * Division of labour, so every number stays traceable:
 * - the model reads the description, works out the geometry, and names
 *   which cited assemblies (CPWD-analysed brickwork, concrete, …) the item
 *   is made of and how much of each (e.g. 10 m² × 0.23 m = 2.3 m³);
 * - code expands each assembly into materials with the cited coefficients;
 * - anything outside the assemblies is listed as "other materials" by
 *   name and matched to the library like a BoQ row.
 * The model never supplies an emission factor or a material coefficient.
 *
 * Pure functions only (no fetch, no React) so the contract is unit-tested.
 */

export const DRAFT_MAX_CHARS = 300;

export interface DraftAssembly {
  assemblyId: string;
  /** In the assembly's unit. */
  quantity: number;
  /** The model's geometry, e.g. "10 m² × 0.23 m". */
  basis: string;
}

export interface DraftOther {
  component: string;
  quantity: number | null;
  unit: Unit | null;
  basis: string;
}

export interface Draft {
  inScope: boolean;
  /** Why the request was refused, when `inScope` is false. */
  reason: string;
  projectName: string;
  functionalUnit: string;
  assumptions: string;
  assemblies: DraftAssembly[];
  others: DraftOther[];
}

/** Library names the model may use for "other materials": generic and mean values, no brands. */
export function vocabulary(materials: MaterialFactor[]): string[] {
  return [...new Set(materials.filter((m) => !m.source.sourceId.startsWith("epd-")).map((m) => m.name))];
}

const SYSTEM = `You draft the inventory for a cradle-to-gate embodied-carbon study of a construction item in India.

Rules:
- Only construction: buildings, building elements (walls, slabs, floors, roofs, columns, foundations), concrete, masonry and civil works. For anything else set inScope=false, explain in reason, and return empty lists.
- Express the item as ASSEMBLIES from the list below wherever one fits. Give the assembly quantity in its unit from the item's geometry (for a wall: area × thickness). If the user gives no size, choose a sensible functional unit (e.g. 1 m² of wall, 1 m³ of concrete) and state it in functionalUnit.
- Each assembly already includes its mortar, cement, sand and any bed-joint steel: never list those again.
- Only for materials no assembly covers (e.g. reinforcement steel in RCC, tiles, glass, paint), add OTHER materials using a name from the material list, a quantity, a unit and a basis.
- basis: the geometry or rule of thumb behind the quantity in one short line, so an engineer can check it.
- assumptions: one or two sentences (dimensions, which assembly and why).
- Never state emission factors or carbon values.`;

/** Groq chat-completions request body (OpenAI-compatible, strict JSON schema). */
export function buildDraftRequest(
  description: string,
  assemblies: Assembly[],
  materials: MaterialFactor[],
  model: string,
) {
  const str = { type: "string" };
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["inScope", "reason", "projectName", "functionalUnit", "assumptions", "assemblies", "others"],
    properties: {
      inScope: { type: "boolean" },
      reason: str,
      projectName: str,
      functionalUnit: str,
      assumptions: str,
      assemblies: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["assemblyId", "quantity", "basis"],
          properties: {
            assemblyId: { type: "string", enum: assemblies.map((a) => a.id) },
            quantity: { type: "number" },
            basis: str,
          },
        },
      },
      others: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["component", "quantity", "unit", "basis"],
          properties: {
            component: str,
            quantity: { type: "number" },
            unit: { type: "string", enum: MATERIAL_UNITS },
            basis: str,
          },
        },
      },
    },
  };

  const assemblyList = assemblies.map((a) => `${a.id} | ${a.name} | per ${a.unit}`).join("\n");
  return {
    model,
    temperature: 0.2,
    reasoning_effort: "low",
    messages: [
      {
        role: "system",
        content: `${SYSTEM}\n\nAssemblies (id | what it is | unit):\n${assemblyList}\n\nMaterial names for "others":\n${vocabulary(materials).join("; ")}`,
      },
      { role: "user", content: description },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "inventory_draft", strict: true, schema },
    },
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const text = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const positive = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);

/**
 * Checks a model reply. Strict mode should already guarantee the shape;
 * this guards against a model or API that doesn't honour it, and drops
 * assemblies that aren't in the cited list.
 */
export function parseDraft(content: string, assemblies: Assembly[]): Draft {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error("The AI reply wasn't valid JSON.");
  }
  if (!isObj(data) || typeof data.inScope !== "boolean" || !Array.isArray(data.assemblies) || !Array.isArray(data.others)) {
    throw new Error("The AI reply didn't have the expected shape.");
  }

  const ids = new Set(assemblies.map((a) => a.id));
  const draftAssemblies: DraftAssembly[] = data.assemblies.filter(isObj).flatMap((a) => {
    const quantity = positive(a.quantity);
    if (typeof a.assemblyId !== "string" || !ids.has(a.assemblyId) || quantity == null) return [];
    return [{ assemblyId: a.assemblyId, quantity, basis: text(a.basis, 300) }];
  });
  const others: DraftOther[] = data.others.filter(isObj).flatMap((o) => {
    const component = text(o.component, 160);
    if (!component) return [];
    // Units are kept even if the matched factor can't convert them: the review table flags it.
    return [{ component, quantity: positive(o.quantity), unit: isUnit(o.unit) ? o.unit : null, basis: text(o.basis, 300) }];
  });

  return {
    inScope: data.inScope,
    reason: text(data.reason),
    projectName: text(data.projectName, 120) || "AI-drafted project",
    functionalUnit: text(data.functionalUnit, 160),
    assumptions: text(data.assumptions, 600),
    assemblies: data.inScope ? draftAssemblies : [],
    others: data.inScope ? others : [],
  };
}
