// Generates src/data/lca/india-materials.ts from the verified extraction JSON.
// Usage: pnpm gen:materials  (reads data/extracted/india_materials.json)
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
const all = JSON.parse(readFileSync(inPath, "utf8"));
const byId = Object.fromEntries(all.map((e) => [e.id, e]));

const CONCRETE_DENSITY_NOTE =
  "Mass for transport and end of life: 2400 kg/m³, from the IS 456:2000 unit weight of plain concrete (24 kN/m³, cl. 19.2.1).";

// id → [name, category, eolGroup, extras]
const PICK = {
  // Cement & binders (EPDs)
  "epd-ultratech-opc": ["OPC, UltraTech", "Cement & binders", "concrete"],
  "epd-acc-opc": ["OPC, ACC", "Cement & binders", "concrete"],
  "epd-ambuja-opc": ["OPC, Ambuja", "Cement & binders", "concrete"],
  "epd-myhome-opc": ["OPC, My Home", "Cement & binders", "concrete"],
  "epd-ultratech-ppc": ["PPC (fly ash), UltraTech", "Cement & binders", "concrete"],
  "epd-acc-ppc": ["PPC (fly ash), ACC", "Cement & binders", "concrete"],
  "epd-ambuja-ppc": ["PPC (fly ash), Ambuja", "Cement & binders", "concrete"],
  "epd-myhome-ppc": ["PPC (fly ash), My Home", "Cement & binders", "concrete"],
  "epd-ultratech-psc": ["PSC (slag), UltraTech", "Cement & binders", "concrete"],
  "epd-myhome-psc": ["PSC (slag), My Home", "Cement & binders", "concrete"],
  "epd-jsw-psc": ["PSC (slag), JSW", "Cement & binders", "concrete"],
  "epd-ultratech-pcc": ["Composite cement, UltraTech", "Cement & binders", "concrete"],
  "epd-myhome-pcc": ["Composite cement, My Home", "Cement & binders", "concrete"],
  "epd-jsw-ggbs-salem": ["GGBS, JSW Salem", "Cement & binders", "concrete"],
  "epd-jsw-ggbs-microfine": ["GGBS and microfine GGBS, JSW", "Cement & binders", "concrete"],
  "epd-jswenergy-flyash": ["Dry fly ash, JSW Energy Ratnagiri", "Cement & binders", "concrete"],
  // Cement & binders (IFC generic)
  "ifc2017-opc": ["OPC, India generic", "Cement & binders", "concrete"],
  "ifc2017-ppc": ["PPC (fly ash), India generic", "Cement & binders", "concrete"],
  "ifc2017-psc": ["PSC (slag), India generic", "Cement & binders", "concrete"],
  "ifc2017-bfslag": ["GGBS, India generic", "Cement & binders", "concrete"],
  "ifc2017-pfa": ["Fly ash, India generic", "Cement & binders", "concrete"],
  "ifc2017-lime": ["Hydrated lime", "Cement & binders", "concrete"],
  "ifc2017-mortar": ["Cement mortar", "Cement & binders", "concrete"],
  "ifc2017-plaster": ["Cement plaster", "Cement & binders", "concrete"],
  // Concrete
  "epd-acc-rmc-m25": ["Ready-mix concrete M25, ACC", "Concrete", "concrete", { density: true }],
  "epd-acc-rmc-m30": ["Ready-mix concrete M30, ACC", "Concrete", "concrete", { density: true }],
  "epd-acc-rmc-m50": ["Ready-mix concrete M50, ACC", "Concrete", "concrete", { density: true }],
  "epd-acc-rmc-m75": ["Ready-mix concrete M75, ACC", "Concrete", "concrete", { density: true }],
  "epd-jsw-rmc-m25": ["Ready-mix concrete M25, JSW", "Concrete", "concrete", { density: true }],
  "epd-jsw-rmc-m30": ["Ready-mix concrete M30, JSW", "Concrete", "concrete", { density: true }],
  "epd-jsw-rmc-m40": ["Ready-mix concrete M40, JSW", "Concrete", "concrete", { density: true }],
  "ifc2017-rmc-opc": ["Ready-mix concrete, OPC, India generic", "Concrete", "concrete"],
  "ifc2017-rmc-fa30": ["Ready-mix concrete, 30% fly ash, India generic", "Concrete", "concrete"],
  "ifc2017-rmc-psc": ["Ready-mix concrete, PSC, India generic", "Concrete", "concrete"],
  "ifc2017-precast": ["Precast concrete, India generic", "Concrete", "concrete"],
  // Steel
  "epd-tata-rebar": ["TMT rebar, Tata Steel Jamshedpur (BF–BOF)", "Steel", "metals"],
  "epd-sail-bsp-tmt": ["TMT rebar, SAIL Bhilai (BF–BOF)", "Steel", "metals"],
  "epd-sail-isp-tmt": ["TMT rebar, SAIL IISCO (BF–BOF)", "Steel", "metals"],
  "epd-jspl-rebar-avg": ["Rebar and wire rod, JSP average (BF–BOF and DRI)", "Steel", "metals"],
  "epd-jspl-tmt-scrap": ["TMT rebar, JSP (100% scrap, EAF)", "Steel", "metals"],
  "epd-ars-tmt": ["TMT rebar, ARS (98% recycled)", "Steel", "metals"],
  "epd-prakash-tmt": ["TMT rebar, Prakash (scrap and sponge iron, IF)", "Steel", "metals"],
  "epd-bhuwalka-tmt": ["TMT rebar, Bhuwalka (re-rolled, 75% scrap)", "Steel", "metals"],
  "epd-peekay-tmt": [
    "TMT rebar, Peekay (scrap and sponge iron, IF)",
    "Steel",
    "metals",
    { extraNote: "Far above similar induction-furnace EPDs (Prakash 992); check the EPD before relying on it." },
  ],
  "epd-sail-isp-sections": ["Structural sections, SAIL IISCO (BF–BOF)", "Steel", "metals"],
  "epd-jspl-structural-avg": ["Structural steel, JSP average", "Steel", "metals"],
  "epd-jspl-structural-scrap": ["Structural steel, JSP (100% scrap, EAF)", "Steel", "metals"],
  "epd-tata-hollow": ["Hollow sections, Tata Structura", "Steel", "metals"],
  "epd-apl-hollow": ["Hollow sections and tubes, APL Apollo", "Steel", "metals"],
  "epd-amns-hrc": ["Hot-rolled coil, AM/NS India", "Steel", "metals"],
  "epd-amns-plate": ["Steel plate, AM/NS India", "Steel", "metals"],
  "epd-tata-lrpc": ["Prestressing wire (LRPC), Tata Steel", "Steel", "metals"],
  "ifc2017-rebar": ["Steel rebar (TMT), India generic", "Steel", "metals"],
  "ifc2017-section": ["Steel sections, India generic", "Steel", "metals"],
  // Bricks & blocks
  "ifc2017-brick-avg": ["Fired clay brick, India average", "Bricks & blocks", "bricks"],
  "ifc2017-brick-btk": ["Fired clay brick, bull's trench kiln", "Bricks & blocks", "bricks"],
  "ifc2017-brick-zigzag": ["Fired clay brick, zig-zag kiln", "Bricks & blocks", "bricks"],
  "ifc2017-brick-clamp": ["Fired clay brick, clamp kiln", "Bricks & blocks", "bricks"],
  "ifc2017-brick-hoffman": ["Fired clay brick, Hoffmann kiln", "Bricks & blocks", "bricks"],
  "ifc2017-honeycomb-brick": ["Honeycomb brick", "Bricks & blocks", "bricks"],
  "epd-jayjalaram-brick": ["Clay brick, Jay Jalaram (bull's trench kiln)", "Bricks & blocks", "bricks"],
  "bkpa2012-fcbtk": ["Kiln firing only, fixed-chimney bull's trench", "Bricks & blocks", "bricks"],
  "bkpa2012-zigzag": ["Kiln firing only, zig-zag", "Bricks & blocks", "bricks"],
  "bkpa2012-vsbk": ["Kiln firing only, vertical shaft (VSBK)", "Bricks & blocks", "bricks"],
  "bkpa2012-ddk": ["Kiln firing only, down-draught", "Bricks & blocks", "bricks"],
  "bkpa2012-tunnel": ["Kiln firing only, tunnel", "Bricks & blocks", "bricks"],
  "ifc2017-falg": ["Fly ash–lime–gypsum (FaLG) brick", "Bricks & blocks", "bricks"],
  "ifc2017-aircrete": ["AAC block", "Bricks & blocks", "concrete"],
  "ifc2017-dense-block": ["Concrete block, dense", "Bricks & blocks", "concrete"],
  "ifc2017-medium-block": ["Concrete block, medium density", "Bricks & blocks", "concrete"],
  "ifc2017-light-block": ["Concrete block, lightweight", "Bricks & blocks", "concrete"],
  "ifc2017-opc-ssb": ["Stabilised soil block, OPC", "Bricks & blocks", "bricks"],
  "ifc2017-psc-ssb": ["Stabilised soil block, PSC", "Bricks & blocks", "bricks"],
  "ifc2017-pfa-ssb": ["Stabilised soil block, fly ash", "Bricks & blocks", "bricks"],
  "epd-saltech-paver": ["Paver blocks, Saltech", "Bricks & blocks", "concrete"],
  // Aggregates & sand
  "ifc2017-aggregate": ["Coarse aggregate, India generic", "Aggregates & sand", "aggregates"],
  "ifc2017-sand": ["Sand, India generic", "Aggregates & sand", "aggregates"],
  // Glass
  "epd-sg-planilux6": ["Clear float glass 6 mm, Saint-Gobain Planilux", "Glass", "glass", { mass: 15 }],
  "epd-sg-parsol6": ["Tinted float glass 6 mm, Saint-Gobain Parsol", "Glass", "glass", { mass: 15 }],
  "epd-sg-orae6": ["Low-carbon float glass 6 mm, Saint-Gobain ORAÉ", "Glass", "glass", { mass: 15 }],
  "ifc2017-float-glass": ["Float glass, India generic", "Glass", "glass"],
  // Finishes
  "epd-gyproc-mr125": ["Plasterboard 12.5 mm moisture resistant, Gyproc", "Finishes", "plasterboard", { mass: 9.06 }],
  "epd-gyproc-plain125": ["Plasterboard 12.5 mm plain, Gyproc", "Finishes", "plasterboard", { mass: 7.3 }],
  "ifc2017-plasterboard": ["Plasterboard, India generic", "Finishes", "plasterboard"],
  "ifc2017-gypsum-plaster": ["Gypsum plaster", "Finishes", "plasterboard"],
  "ifc2017-glazed-tile": ["Glazed ceramic tile", "Finishes", undefined],
  "ifc2017-vitrified-tile": ["Vitrified tile", "Finishes", undefined],
  "ifc2017-stone-tile": ["Stone floor tile", "Finishes", undefined],
  "ifc2017-clay-roof-tile": ["Clay roof tile", "Finishes", "bricks"],
  "ifc2017-fibre-cement": ["Fibre cement sheet", "Finishes", undefined],
  "epd-berger-paint": ["Water-based paint, Berger (product group)", "Finishes", undefined],
  // Metals
  "epd-bhoruka-alu": ["Aluminium extrusions, powder coated, Bhoruka", "Metals", "metals"],
  "epd-cmr-alu-billet": ["Aluminium billet, 98% scrap, CMR", "Metals", "metals"],
  "ifc2017-alu-profile": ["Aluminium extrusions, India generic", "Metals", "metals"],
  "ifc2017-alu-sheet": ["Aluminium sheet, India generic", "Metals", "metals"],
};

// Declared units seen in the extraction. Anything else fails loudly: a
// silently wrong unit would be off by 1000× or more.
const unitOf = (du) => {
  if (du.startsWith("1000 kg")) return "t";
  if (du.startsWith("1 m3")) return "m3";
  if (du.startsWith("1 m2")) return "m2";
  if (du.startsWith("1 kg")) return "kg";
  throw new Error("Unrecognised declared unit: " + du);
};

const qualityOf = (e) => (e.source_type === "EPD" ? "india-epd" : "india-literature");
const indicatorOf = (e) => (e.id.startsWith("bkpa") ? "CO2 only" : e.gwp_indicator === "GWP-total" ? "GWP-total" : "CO2e");

const sum = (xs) => xs.reduce((s, x) => s + (x ?? 0), 0);
const round = (x) => Math.round(x * 1e6) / 1e6;

// Sources: one per EPD, one each for IFC 2017 and the kiln report.
const sources = new Map();
function sourceFor(e) {
  if (e.id.startsWith("ifc2017")) {
    sources.set("ifc-2017", {
      id: "ifc-2017",
      short: "IFC (2017)",
      citation: e.citation,
      url: e.url,
      license:
        "© IFC 2017. Individual values cited with attribution; IFC grants permission for educational, non-commercial use on request.",
      bibtex: {
        type: "techreport",
        fields: {
          author: "{International Finance Corporation}",
          title: "India Construction Materials Database of Embodied Energy and Global Warming Potential: Methodology and Results, Version 1.0",
          institution: "IFC, World Bank Group (developed by thinkstep)",
          year: "2017",
        },
      },
    });
    return "ifc-2017";
  }
  if (e.id.startsWith("bkpa")) {
    sources.set("bkpa-2012", {
      id: "bkpa-2012",
      short: "Maithel et al. (2012)",
      citation: e.citation,
      url: e.url,
      license: "Research-consortium report, no open licence stated. Values cited with attribution.",
      bibtex: {
        type: "techreport",
        fields: {
          author: "Maithel, Sameer and Uma, R. and others",
          title: "Brick Kilns Performance Assessment: A Roadmap for Cleaner Brick Production in India",
          institution: "Greentech Knowledge Solutions; Shakti Sustainable Energy Foundation",
          year: "2012",
        },
      },
    });
    return "bkpa-2012";
  }
  const owner = (e.manufacturer ?? "").replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+(Ltd\.?|Limited|Pvt|Private|Industries|\(P\))\b.*$/i, "").trim();
  const year = String(e.published ?? e.year).slice(0, 4);
  sources.set(e.id, {
    id: e.id,
    short: `${owner} EPD (${year})`,
    citation: e.citation,
    url: e.url,
    license: "EPD on the International EPD System; results cited with registration number, document not redistributed.",
    bibtex: {
      type: "techreport",
      fields: {
        author: `{${e.manufacturer}}`,
        title: `Environmental Product Declaration: ${e.product_or_dataset}`,
        institution: "The International EPD System",
        number: e.registration_no,
        year,
      },
    },
  });
  return e.id;
}

const materials = [];
for (const [id, [name, category, eolGroup, extra = {}]] of Object.entries(PICK)) {
  const e = byId[id];
  if (!e) throw new Error(`missing ${id}`);
  if (!e.verified) throw new Error(`unverified ${id}`);
  const declaredUnit = unitOf(e.declared_unit);
  const c = [e.c1, e.c2, e.c3, e.c4];
  const hasC = c.some((x) => x != null);
  const notes = [
    e.notes,
    e.valid_until ? `EPD ${e.registration_no}, valid until ${e.valid_until}.` : null,
    extra.density ? CONCRETE_DENSITY_NOTE : null,
    extra.extraNote ?? null,
  ]
    .filter(Boolean)
    .join(" ");
  materials.push({
    id,
    name,
    category,
    declaredUnit,
    gwp: e.gwp_a1a3,
    ...(extra.density ? { massPerUnitKg: 2400 } : {}),
    ...(extra.mass ? { massPerUnitKg: extra.mass } : {}),
    ...(hasC || e.d != null
      ? { epdEndOfLife: { ...(hasC ? { c1c4: round(sum(c)) } : {}), ...(e.d != null ? { d: e.d } : {}) } }
      : {}),
    ...(eolGroup ? { eolGroup } : {}),
    ...(e.background_db ? { backgroundDb: e.background_db } : {}),
    indicator: indicatorOf(e),
    geography: e.geography,
    year: Number(String(e.year).slice(0, 4)),
    quality: qualityOf(e),
    source: { sourceId: sourceFor(e), locator: e.table_or_page },
    notes,
  });
}

// Derived: mean of Indian cement EPDs per type, range = min–max.
const MEANS = [
  ["in-epd-mean-opc", "OPC, mean of Indian EPDs", ["epd-ultratech-opc", "epd-acc-opc", "epd-ambuja-opc", "epd-myhome-opc"]],
  ["in-epd-mean-ppc", "PPC (fly ash), mean of Indian EPDs", ["epd-ultratech-ppc", "epd-acc-ppc", "epd-ambuja-ppc", "epd-myhome-ppc"]],
  ["in-epd-mean-psc", "PSC (slag), mean of Indian EPDs", ["epd-ultratech-psc", "epd-myhome-psc", "epd-jsw-psc"]],
  ["in-epd-mean-pcc", "Composite cement, mean of Indian EPDs", ["epd-ultratech-pcc", "epd-myhome-pcc"]],
];
for (const [id, name, ids] of MEANS) {
  const vals = ids.map((i) => byId[i].gwp_a1a3);
  const mean = round(sum(vals) / vals.length);
  materials.push({
    id,
    name,
    category: "Cement & binders",
    declaredUnit: "t",
    gwp: mean,
    low: Math.min(...vals),
    high: Math.max(...vals),
    eolGroup: "concrete",
    indicator: "GWP-total",
    geography: "India",
    year: 2025,
    quality: "india-epd",
    source: {
      sourceId: "india-cement-epds",
      locator: `Mean of ${vals.length} EPDs: ${ids.map((i) => `${sources.get(i).short.replace(/ EPD.*/, "")} ${byId[i].gwp_a1a3}`).join(", ")}`,
    },
    notes: "Arithmetic mean of the Indian EPDs listed; range is their minimum to maximum. Use a specific EPD when the brand is known.",
  });
}
sources.set("india-cement-epds", {
  id: "india-cement-epds",
  short: "Indian cement EPDs",
  citation:
    "Indian cement Environmental Product Declarations on the International EPD System (UltraTech EPD-IES-0005019, ACC EPD-IES-0031051 and PPC EPD, Ambuja EPD-IES-0031048 and PPC EPD, My Home, JSW). Mean and range computed by CarbonKhata.",
  url: "https://www.environdec.com/library",
  license: "Values cited from public EPDs with registration numbers.",
  bibtex: { type: "misc", fields: { title: "Indian cement EPDs, International EPD System", year: "2025" } },
});

const header = `/**
 * GENERATED by scripts/gen-materials.mjs (pnpm gen:materials) from the verified
 * extraction in data/extracted/india_materials.json — every value was read from
 * the source document. Edit the generator's selection, not this file by hand.
 */
import type { MaterialFactor } from "@/lib/lca/types";
import type { Source } from "@/data/lca/sources";
`;
const out =
  header +
  `\nexport const INDIA_SOURCES: Omit<Source, "accessed">[] = ${JSON.stringify([...sources.values()], null, 2)};\n` +
  `\nexport const INDIA_MATERIALS: MaterialFactor[] = ${JSON.stringify(materials, null, 2)};\n`;
writeFileSync(outPath, out);
console.log(`${materials.length} materials, ${sources.size} sources → ${outPath}`);
