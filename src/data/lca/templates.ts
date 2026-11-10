import { QUANTITY_SOURCES, expandAssembly, getAssembly, type Assembly } from "@/data/lca/assemblies";
import { getMaterial } from "@/data/lca/materials";
import { VALIDATION_CASES } from "@/data/lca/validation";
import { newId } from "@/lib/lca/project";
import type { InventoryItem, Project } from "@/lib/lca/types";

/**
 * Worked examples a scholar can open and modify: published studies
 * reproduced line by line, and the construction items Indian LCA studies
 * assess most often, built from CPWD's material analyses.
 */
export interface Template {
  id: string;
  title: string;
  summary: string;
  /** "reproduces" a published study, or takes its "quantities" from a cited analysis. */
  kind: "reproduces" | "quantities";
  /** Short citation shown on the card. */
  basedOn: string;
  /** Templates sharing a group are alternatives for the same job. */
  group?: string;
  build: () => Omit<Project, "schemaVersion" | "id" | "createdAt" | "updatedAt">;
}

const A1A3_ONLY = { a4: false, a5: false, c: false, d: false };

function fromAssembly(a: Assembly, functionalUnit: string, comparisonNote: string) {
  return (): ReturnType<Template["build"]> => ({
    name: `${a.name} (1 ${a.unit === "m3" ? "m³" : a.unit})`,
    scope: {
      goal: `Cradle-to-gate (A1–A3) embodied carbon of ${a.name.toLowerCase()}.`,
      functionalUnit,
      boundary: A1A3_ONLY,
      assumptions: [
        `Materials per unit of work from ${a.source}.`,
        "Mortar split into cement and sand with DAR 2014 sub-head 3. Volumes and brick counts converted to kg with IS 875 (Part 1) unit weights, IS 1077 / IS 12894 brick sizes and IFC 2017 densities.",
        a.note,
        comparisonNote,
        `Sources: ${QUANTITY_SOURCES.dar2014} ${QUANTITY_SOURCES.is875} ${QUANTITY_SOURCES.is1077}`,
      ]
        .filter(Boolean)
        .join(" "),
    },
    items: expandAssembly(a, 1).map(
      (l): InventoryItem => ({ id: newId(), label: l.label, material: getMaterial(l.materialId)!, quantity: l.quantity, unit: l.unit }),
    ),
    siteEnergy: [],
  });
}

const WALL_NOTE =
  "Compared per m³ of masonry. Walls of different materials differ in thickness, strength and thermal performance, so a design decision should compare walls that do the same job.";
const M25_NOTE =
  "Site batching energy is not included; the ready-mix template's EPD covers plant production.";

const assembly = (id: string) => getAssembly(id)!;

const ASSEMBLY_TEMPLATES: Template[] = [
  {
    id: "wall-clay-brick",
    title: "1 m³ clay brick masonry",
    summary: "494 burnt clay bricks and 0.25 m³ of 1:6 mortar, the most common Indian wall.",
    kind: "quantities",
    basedOn: "CPWD DAR 2014 item 6.4.2",
    group: "Walls: which masonry?",
    build: fromAssembly(assembly("brick-clay-cm16"), "1 m³ of masonry", WALL_NOTE),
  },
  {
    id: "wall-falg-brick",
    title: "1 m³ fly ash–lime brick masonry",
    summary: "487 FaL-G bricks and 0.22 m³ of 1:6 mortar: the fly ash alternative.",
    kind: "quantities",
    basedOn: "CPWD DAR 2014 item 6.34.2",
    group: "Walls: which masonry?",
    build: fromAssembly(assembly("brick-falg-cm16"), "1 m³ of masonry", WALL_NOTE),
  },
  {
    id: "wall-aac",
    title: "1 m³ AAC block masonry",
    summary: "AAC blocks in 1:4 mortar with bed-joint steel: the lightweight alternative.",
    kind: "quantities",
    basedOn: "CPWD DAR 2014 item 6.38",
    group: "Walls: which masonry?",
    build: fromAssembly(assembly("aac-cm14"), "1 m³ of masonry", WALL_NOTE),
  },
  {
    id: "m25-site",
    title: "1 m³ M25 concrete, batched on site",
    summary: "330 kg cement, 0.425 m³ sand and 0.85 m³ aggregate per the CPWD design mix.",
    kind: "quantities",
    basedOn: "CPWD DAR 2014 item 5.33.1",
    group: "Concrete: site mix or ready-mix?",
    build: fromAssembly(assembly("concrete-m25-design"), "1 m³ of M25 concrete", M25_NOTE),
  },
  {
    id: "m25-rmc",
    title: "1 m³ M25 ready-mix concrete",
    summary: "One cubic metre from a verified Indian EPD, plant production included.",
    kind: "quantities",
    basedOn: "ACC ready-mix concrete EPD",
    group: "Concrete: site mix or ready-mix?",
    build: () => ({
      name: "M25 ready-mix concrete (1 m³)",
      scope: {
        goal: "Cradle-to-gate (A1–A3) embodied carbon of 1 m³ of M25 ready-mix concrete.",
        functionalUnit: "1 m³ of M25 concrete",
        boundary: A1A3_ONLY,
        assumptions: `One m³ of ACC's EPD-declared M25; switch the factor to JSW's M25 EPD to compare suppliers. ${M25_NOTE}`,
      },
      items: [{ id: newId(), label: "Ready-mix concrete M25", material: getMaterial("epd-acc-rmc-m25")!, quantity: 1, unit: "m3" }],
      siteEnergy: [],
    }),
  },
];

const VALIDATION_TEMPLATES: Template[] = VALIDATION_CASES.map((c) => ({
  id: c.id,
  title: c.title,
  summary:
    "A published building study rebuilt line by line. Material production (A1–A3) and site work (A5) match the paper exactly; its truck transport (A4, 24.6 t) is left out.",
  kind: "reproduces",
  basedOn: c.citation,
  group: "Whole building",
  build: c.build,
}));

export const TEMPLATES: Template[] = [...ASSEMBLY_TEMPLATES, ...VALIDATION_TEMPLATES];
