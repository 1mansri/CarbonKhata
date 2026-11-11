// Builds the BTP thesis PDF in the layout of the department's reference report.
// Run: node docs/report/build.mjs   (needs Google Chrome and Poppler: pdftotext, pdfunite)
//
// Every number in the figures is computed below from the same inputs the Cradle
// engine uses (CPWD DAR 2014 quantities, IS 875 densities, library factors), or
// copied from the engine's validation output; nothing is typed in twice.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "BTP_Thesis_Durgesh_Kumar_23CE36005.pdf");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "btp-report-"));
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const LOGO = `data:image/png;base64,${fs.readFileSync(path.join(HERE, "iitkgp-logo.png")).toString("base64")}`;

const CO2 = "CO<sub>2</sub>";
const CO2e = "CO<sub>2</sub>e";

/* ------------------------------------------------------------------ data */

// CPWD DAR 2014 quantities and IS 875 / IS 1077 / IFC 2017 densities (src/data/lca/assemblies.ts).
const BRICK_KG = 0.23 * 0.11 * 0.07 * 1760; // 3.117 kg per brick
const SAND = 1570; // kg/m³
const OPC = [996, 983, 1010, 921]; // Indian OPC EPDs, kg CO2e/t (UltraTech, ACC, Ambuja, My Home)
const OPC_MEAN = OPC.reduce((s, v) => s + v, 0) / OPC.length; // 977.5
const EF = { brickAvg: 0.39, falg: 0.2, aac: 0.5, sand: 0.009, rebar: 2.6 }; // IFC 2017, kg CO2e/kg
const mortar = (m3, cementTperM3) => ({ cement: m3 * cementTperM3 * OPC_MEAN, sand: m3 * 1.07 * SAND * EF.sand });
const m16clay = mortar(0.25, 0.25);
const m16falg = mortar(0.22, 0.25);
const m14aac = mortar(0.15, 0.38);
const CLAY_BRICK_KG = 494 * BRICK_KG;
const WALLS = [
  { name: "Clay brick, mortar 1:6", parts: { unit: CLAY_BRICK_KG * EF.brickAvg, cement: m16clay.cement, sand: m16clay.sand, steel: 0 } },
  { name: "FaL-G brick, mortar 1:6", parts: { unit: 487 * BRICK_KG * EF.falg, cement: m16falg.cement, sand: m16falg.sand, steel: 0 } },
  { name: "AAC block, mortar 1:4", parts: { unit: 500 * EF.aac, cement: m14aac.cement, sand: m14aac.sand, steel: 13.2 * EF.rebar } },
].map((w) => ({ ...w, total: Object.values(w.parts).reduce((s, v) => s + v, 0) }));
const CLAY_MORTAR = m16clay.cement + m16clay.sand;
const KILNS = [
  { name: "Hoffmann kiln", ef: 0.31 },
  { name: "Bull's trench kiln", ef: 0.32 },
  { name: "India average (used in Fig. @fig:walls)", ef: 0.39, main: true },
  { name: "Clamp kiln", ef: 0.57 },
  { name: "Zigzag kiln", ef: 0.59 },
].map((k) => ({ ...k, wall: CLAY_BRICK_KG * k.ef + CLAY_MORTAR }));
const CEMENTS = [
  { name: "OPC (ordinary Portland)", epds: OPC },
  { name: "PPC (fly ash)", epds: [710, 738, 739, 660] },
  { name: "Composite (fly ash + slag)", epds: [541, 425] },
  { name: "PSC (slag)", epds: [487, 424, 358.8], main: true },
].map((c) => ({ ...c, mean: c.epds.reduce((s, v) => s + v, 0) / c.epds.length, low: Math.min(...c.epds), high: Math.max(...c.epds) }));

// Validation case: engine output (src/data/lca/validation.ts), equal to Table S4 of the paper.
const VALIDATION_A13 = 899412.37;
const VALIDATION_A5 = 12074.6;
const HOTSPOTS = [
  { name: "Burnt clay bricks", kg: 350239.5, main: true },
  { name: "Portland cement", kg: 314525.8, main: true },
  { name: "Steel bars", kg: 90085.6 },
  { name: "Aluminium sections", kg: 23156.7 },
  { name: "Anodising of aluminium", kg: 13157.2 },
  { name: "Ceramic glazed tiles", kg: 10661.6 },
  { name: "Coarse sand", kg: 10128.9 },
];
const HOT_OTHER = VALIDATION_A13 - HOTSPOTS.reduce((s, r) => s + r.kg, 0);
const share = (kg) => (kg / VALIDATION_A13) * 100;

// Library counts (src/data/lca/materials.ts).
const LIBRARY = [
  { name: "Cement & binders", n: 29, main: true },
  { name: "Steel", n: 25, main: true },
  { name: "Bricks & blocks", n: 21, main: true },
  { name: "Concrete", n: 11 },
  { name: "Finishes", n: 10 },
  { name: "Glass", n: 4 },
  { name: "Other metals", n: 4 },
  { name: "Aggregates & sand", n: 2 },
];
const LIB_TOTAL = LIBRARY.reduce((s, r) => s + r.n, 0);

// Spread between Indian sources (literature review, Table 2 of docs/research).
const SPREAD = [
  { name: "Coarse aggregate", low: 0.0028, high: 0.0408, unit: "kg CO₂e/kg" },
  { name: "Fired clay brick", low: 0.097, high: 0.59, unit: "kg CO₂e/kg", main: true },
  { name: "Grid electricity", low: 0.675, high: 1.38, unit: "kg CO₂/kWh" },
  { name: "Same high-rise building", low: 373, high: 530, unit: "kg CO₂e/m²" },
  { name: "OPC concrete", low: 335, high: 425, unit: "kg CO₂e/m³" },
  { name: "OPC cement", low: 0.82, high: 0.93, unit: "kg CO₂e/kg" },
];

const f0 = (v) => v.toLocaleString("en-US", { maximumFractionDigits: 0 });
const f1 = (v) => v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* --------------------------------------------------------------- figures */

const C = { ink: "#111", quiet: "#555", grey: "#9c9c9c", accent: "#1f4e79", grid: "#d6d6d6", axis: "#444", steel: "#7a7a7a" };
const svg = (h, body) => `<svg viewBox="0 0 600 ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${body}</svg>`;
const T = (x, y, s, a = "") => `<text x="${x}" y="${y}" ${a}>${s}</text>`;
const sCO2e = 'CO<tspan font-size="70%" baseline-shift="sub">2</tspan>e';
const unitSvg = (u) => u.replace("CO₂e", sCO2e).replace("CO₂", 'CO<tspan font-size="70%" baseline-shift="sub">2</tspan>');
const ARROW = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.axis}"/></marker></defs>`;

function figModules() {
  const y = 4, h = 128;
  const boxes = [
    { x: 2, w: 108, main: true, title: "Product stage", lines: ["A1 Raw materials", "A2 Transport", "A3 Manufacturing"], note: "always included" },
    { x: 120, w: 122, title: "Construction", lines: ["A4 Transport to site", "A5 Construction"], note: "optional" },
    { x: 252, w: 92, out: true, title: "Use stage", lines: ["B1–B7 Use,", "maintenance", "and repair"], note: "not included" },
    { x: 354, w: 122, title: "End of life", lines: ["C1 Demolition", "C2 Transport", "C3 Waste processing", "C4 Disposal"], note: "optional" },
    { x: 486, w: 112, dashed: true, title: "Beyond life (D)", lines: ["Reuse, recovery", "and recycling"], note: "shown separately" },
  ];
  const body = boxes
    .map((b) => {
      const ink = b.out ? C.quiet : C.ink;
      const rect = `<rect x="${b.x}" y="${y}" width="${b.w}" height="${h}" rx="6" fill="${b.main ? C.accent : "none"}" fill-opacity="${b.main ? 0.08 : 1}" stroke="${b.main ? C.accent : b.out ? C.grey : C.axis}" stroke-width="${b.main ? 2 : 1.2}" ${b.out || b.dashed ? 'stroke-dasharray="4 3"' : ""}/>`;
      const lines = b.lines.map((l, i) => T(b.x + 8, y + 44 + i * 16, l, `font-size="12" fill="${ink}"`)).join("");
      return rect + T(b.x + 8, y + 22, b.title, `font-size="13.5" font-weight="bold" fill="${ink}"`) + lines + T(b.x + 8, y + 116, b.note, `font-size="11.5" font-style="italic" fill="${C.quiet}"`);
    })
    .join("");
  const brackets = `<g fill="none" stroke="${C.axis}" stroke-width="1.1"><path d="M2 140V148H110V140"/><path d="M2 176V184H476V176"/></g>`;
  return svg(
    212,
    body +
      brackets +
      T(56, 166, "Cradle-to-gate", `font-size="12.5" text-anchor="middle" fill="${C.ink}"`) +
      T(239, 202, "Total reported = A1–A3 + A4 + A5 + C1–C4", `font-size="12.5" text-anchor="middle" fill="${C.ink}"`) +
      T(542, 166, "not added to the total", `font-size="11.5" font-style="italic" text-anchor="middle" fill="${C.quiet}"`),
  );
}

function figSpread() {
  const left = 240, wide = 300, max = 15, X = (v) => left + (v / max) * wide, y0 = 44, step = 46;
  const rows = SPREAD.map((r, i) => {
    const y = y0 + i * step, ratio = r.high / r.low;
    return (
      T(0, y, r.name, `font-size="13.5" ${r.main ? 'font-weight="bold"' : ""} fill="${C.ink}"`) +
      T(0, y + 16, `${r.low} to ${r.high} ${unitSvg(r.unit)}`, `font-size="11.5" fill="${C.quiet}"`) +
      `<rect x="${left}" y="${y - 8}" width="${X(ratio) - left}" height="18" fill="${r.main ? C.accent : C.grey}" fill-opacity="${r.main ? 0.9 : 0.6}"/>` +
      T(X(ratio) + 7, y + 6, `${ratio.toFixed(1)}×`, `font-size="13" ${r.main ? 'font-weight="bold"' : ""} fill="${C.ink}"`)
    );
  }).join("");
  const ref = `<line x1="${X(1)}" x2="${X(1)}" y1="20" y2="${y0 + (SPREAD.length - 1) * step + 22}" stroke="${C.axis}" stroke-dasharray="3 3"/>` + T(X(1) + 5, 14, "1× = all sources agree", `font-size="11.5" font-style="italic" fill="${C.quiet}"`);
  return svg(y0 + (SPREAD.length - 1) * step + 30, ref + rows);
}

function figWorkflow() {
  const W = 132, rowA = 4, hA = 100, rowB = 144, hB = 78, xs = [2, 156, 310, 464];
  const box = (x, y, h, main) => `<rect x="${x}" y="${y}" width="${W}" height="${h}" rx="6" fill="${main ? C.accent : "none"}" fill-opacity="${main ? 0.08 : 1}" stroke="${main ? C.accent : C.axis}" stroke-width="${main ? 2 : 1.2}"/>`;
  const block = (x, y, h, title, lines, main = false, quiet = false) =>
    box(x, y, h, main) + T(x + 8, y + 22, title, `font-size="13" font-weight="bold" fill="${C.ink}"`) + lines.map((l, i) => T(x + 8, y + 44 + i * 16, l, `font-size="12" fill="${quiet ? C.quiet : C.ink}"`)).join("");
  const top = [
    ["1. Goal and scope", ["Functional unit", "Life-cycle modules", "Assumptions"]],
    ["2. Inventory", ["Manual entry", "BoQ import", "AI draft (size only)"]],
    ["3. Impact", ["Quantity × factor", "for each module", "Working for each line"]],
    ["4. Interpretation", ["Largest contributors", "Monte Carlo range", "Indian-data share"]],
  ].map(([t, l], i) => block(xs[i], rowA, hA, t, l)).join("");
  const bottom =
    block(xs[1], rowB, hB, "CPWD DAR 2014", ["Materials per unit", "of work (Table @tab:cpwd)"], false, true) +
    block(xs[2], rowB, hB, "Factor library", [`${LIB_TOTAL} Indian factors`, "source and page each"], true) +
    block(xs[3], rowB, hB, "Outputs", ["Report, Excel,", "BibTeX, project file"], false, true);
  const mid = rowA + hA / 2;
  const arrows = `<g fill="none" stroke="${C.axis}" stroke-width="1.2">${[0, 1, 2].map((i) => `<path d="M${xs[i] + W} ${mid}H${xs[i + 1]}" marker-end="url(#ar)"/>`).join("")}<path d="M${xs[1] + W / 2} ${rowB}V${rowA + hA}" marker-end="url(#ar)"/><path d="M${xs[2] + W / 2} ${rowB}V${rowA + hA}" marker-end="url(#ar)"/><path d="M${xs[3] + W / 2} ${rowA + hA}V${rowB}" marker-end="url(#ar)"/></g>`;
  return svg(rowB + hB + 6, ARROW + top + bottom + arrows);
}

function hbars({ rows, label, value, valueText, max, left, wide, step = 30, y0 = 16, extra = "" }) {
  const X = (v) => (v / max) * wide;
  const body = rows.map((r, i) => {
    const y = y0 + i * step;
    return (
      T(left - 10, y + 5, label(r), `font-size="13" text-anchor="end" ${r.main ? 'font-weight="bold"' : ""} fill="${r.quiet ? C.quiet : C.ink}"`) +
      `<rect x="${left}" y="${y - 9}" width="${X(value(r))}" height="18" fill="${r.main ? C.accent : C.grey}" fill-opacity="${r.main ? 0.9 : r.quiet ? 0.35 : 0.6}"/>` +
      T(left + X(value(r)) + 7, y + 5, valueText(r), `font-size="12.5" ${r.main ? 'font-weight="bold"' : ""} fill="${r.quiet ? C.quiet : C.ink}"`)
    );
  }).join("");
  return svg(y0 + (rows.length - 1) * step + 18, extra + body);
}

const figLibrary = () =>
  hbars({ rows: LIBRARY, label: (r) => r.name.replace("&", "&amp;"), value: (r) => r.n, valueText: (r) => `${r.n}`, max: 29, left: 150, wide: 360 });

const figHotspots = () =>
  hbars({
    rows: [...HOTSPOTS, { name: `Other ${78 - HOTSPOTS.length} materials`, kg: HOT_OTHER, quiet: true }],
    label: (r) => r.name,
    value: (r) => r.kg,
    valueText: (r) => `${f1(r.kg / 1000)} t (${f1(share(r.kg))}%)`,
    max: HOTSPOTS[0].kg,
    left: 180,
    wide: 280,
  });

function figWalls() {
  const parts = [
    { key: "unit", name: "Bricks or blocks", fill: C.accent, op: 0.9 },
    { key: "cement", name: "Cement (in mortar)", fill: C.accent, op: 0.45 },
    { key: "sand", name: "Sand (in mortar)", fill: C.accent, op: 0.18 },
    { key: "steel", name: "Bed-joint steel", fill: C.steel, op: 0.9 },
  ];
  const left = 170, wide = 340, max = WALLS[0].total, X = (v) => (v / max) * wide, y0 = 62, step = 50;
  const legend = parts.map((p, i) => `<rect x="${i * 150}" y="4" width="13" height="13" fill="${p.fill}" fill-opacity="${p.op}"/>` + T(i * 150 + 19, 15, p.name, `font-size="12" fill="${C.quiet}"`)).join("");
  const bars = WALLS.map((w, i) => {
    const y = y0 + i * step;
    let run = left;
    const segs = parts.map((p) => {
      const v = w.parts[p.key];
      if (!v) return "";
      const x = run;
      run += X(v);
      return `<rect x="${x}" y="${y - 13}" width="${X(v)}" height="26" fill="${p.fill}" fill-opacity="${p.op}"/>` + (p.key === "unit" ? T(x + 8, y + 5, f0(v), `font-size="12.5" fill="#fff"`) : "");
    }).join("");
    return T(left - 10, y + 5, w.name, `font-size="13" text-anchor="end" fill="${C.ink}"`) + segs + T(left + X(w.total) + 8, y + 5, `${f0(w.total)} kg`, `font-size="13.5" font-weight="bold" fill="${C.ink}"`);
  }).join("");
  return svg(y0 + 2 * step + 22, legend + bars);
}

function figKilns() {
  const left = 220, wide = 290, X = (v) => left + (v / 1000) * wide, y0 = 42, step = 34, aac = WALLS[2].total;
  const ref = `<line x1="${X(aac)}" x2="${X(aac)}" y1="22" y2="${y0 + 4 * step + 14}" stroke="${C.axis}" stroke-dasharray="3 3"/>` + T(X(aac) + 5, 16, `AAC masonry: ${f0(aac)}`, `font-size="11.5" font-style="italic" fill="${C.quiet}"`);
  const rows = KILNS.map((k, i) => {
    const y = y0 + i * step;
    return (
      T(left - 10, y + 5, k.name, `font-size="13" text-anchor="end" ${k.main ? 'font-weight="bold"' : ""} fill="${C.ink}"`) +
      `<rect x="${left}" y="${y - 10}" width="${X(k.wall) - left}" height="20" fill="${k.main ? C.accent : C.grey}" fill-opacity="${k.main ? 0.9 : 0.6}"/>` +
      T(X(k.wall) + 7, y + 5, f0(k.wall), `font-size="13" ${k.main ? 'font-weight="bold"' : ""} fill="${C.ink}"`) +
      T(X(k.wall) + 36, y + 5, `(${k.ef.toFixed(2)})`, `font-size="11.5" fill="${C.quiet}"`)
    );
  }).join("");
  return svg(y0 + 4 * step + 22, ref + rows);
}

function figCements() {
  const left = 210, wide = 350, max = 1100, X = (v) => left + (v / max) * wide, y0 = 24, step = 44, base = y0 + 3 * step + 22;
  const ticks = [0, 250, 500, 750, 1000].map((t) => `<line x1="${X(t)}" x2="${X(t)}" y1="6" y2="${base}" stroke="${C.grid}"/>` + T(X(t), base + 16, `${t}`, `font-size="11.5" text-anchor="middle" fill="${C.quiet}"`)).join("");
  const rows = CEMENTS.map((c, i) => {
    const y = y0 + i * step, col = c.main ? C.accent : C.axis;
    return (
      T(left - 12, y + 1, c.name, `font-size="13" text-anchor="end" ${c.main ? 'font-weight="bold"' : ""} fill="${C.ink}"`) +
      T(left - 12, y + 16, `${c.epds.length} EPDs`, `font-size="11.5" text-anchor="end" fill="${C.quiet}"`) +
      `<g stroke="${col}" stroke-width="1.8"><line x1="${X(c.low)}" x2="${X(c.high)}" y1="${y}" y2="${y}"/><line x1="${X(c.low)}" x2="${X(c.low)}" y1="${y - 6}" y2="${y + 6}"/><line x1="${X(c.high)}" x2="${X(c.high)}" y1="${y - 6}" y2="${y + 6}"/></g>` +
      `<circle cx="${X(c.mean)}" cy="${y}" r="5.5" fill="${c.main ? C.accent : "#fff"}" stroke="${col}" stroke-width="1.6"/>` +
      T(X(c.high) + 9, y + 5, f0(c.mean), `font-size="13" ${c.main ? 'font-weight="bold"' : ""} fill="${C.ink}"`)
    );
  }).join("");
  return svg(base + 40, ticks + rows + T(X(550), base + 34, `kg ${sCO2e} per tonne of cement (A1–A3)`, `font-size="12" text-anchor="middle" fill="${C.quiet}"`));
}


/* ------------------------------------------------------- content builder */

const labels = {};
const toc = [];
const lof = [];
const lot = [];
const parts = [];
let ch = 0, sec = 0, nf = 0, nt = 0, ne = 0;
const add = (html) => parts.push(html);
const strip = (s) => s.replace(/<[^>]+>/g, "");

function chapter(title) {
  ch++; sec = 0; nf = 0; nt = 0; ne = 0;
  toc.push({ lvl: 0, num: `${ch}`, title, find: `${ch}. ${title}` });
  add(`<h1 class="chapter">${ch}. ${title.toUpperCase()}</h1>`);
}
function section(title, key) {
  sec++;
  const num = `${ch}.${sec}`;
  if (key) labels[`sec:${key}`] = num;
  toc.push({ lvl: 1, num, title, find: `${num} ${title}` });
  add(`<h2>${num} ${title}</h2>`);
}
function figure(key, svgHtml, caption) {
  nf++;
  const num = `${ch}.${nf}`;
  labels[`fig:${key}`] = num;
  lof.push({ num, title: caption, find: `Figure ${num}: ${caption}` });
  add(`<figure>${svgHtml}<figcaption class="caption">Figure ${num}: ${caption}</figcaption></figure>`);
}
// A real screenshot of the app (docs/report/screens, made by screenshots.mjs) in a browser or laptop frame.
const shotSrc = (file) => `data:image/jpeg;base64,${fs.readFileSync(path.join(HERE, "screens", file)).toString("base64")}`;
function screen(key, file, url, caption, { laptop = false } = {}) {
  const pic = `<img src="${shotSrc(file)}" alt="">`;
  const frame = laptop
    ? `<div class="laptop"><div class="lid"><span class="cam"></span>${pic}</div><div class="base"></div></div>`
    : `<div class="browser"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="url">${url}</span></div>${pic}</div>`;
  figure(key, frame, caption);
}
function table(key, caption, head, rows, { widths, total = false, small = false } = {}) {
  nt++;
  const num = `${ch}.${nt}`;
  labels[`tab:${key}`] = num;
  lot.push({ num, title: caption, find: `Table ${num}: ${caption}` });
  const cols = widths ? `<colgroup>${widths.map((w) => `<col style="width:${w}%">`).join("")}</colgroup>` : "";
  const tr = (r, i) => `<tr${total && i === rows.length - 1 ? ' class="total"' : ""}>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`;
  add(`<div class="tbl${small ? " small" : ""}"><table class="t">${cols}<thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(tr).join("")}</tbody></table><div class="caption">Table ${num}: ${caption}</div></div>`);
}
function eq(key, html) {
  ne++;
  const num = `${ch}.${ne}`;
  labels[`eq:${key}`] = num;
  add(`<div class="eq"><span>${html}</span><span class="eqn">(${num})</span></div>`);
}
const p = (html) => add(`<p>${html}</p>`);
const ul = (items) => add(`<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`);
const ol = (items) => add(`<ol>${items.map((i) => `<li>${i}</li>`).join("")}</ol>`);
const v = (s) => `<i>${s}</i>`;

/* ---------------------------------------------------------- chapter 1 */

chapter("Introduction");
section("Background");
p(`Buildings produce about 30% of India's greenhouse gas emissions, and 48% of building emissions are <i>embodied</i>: they come from making building materials, not from running the building [NITI Aayog, 2026]. In the building studied in Chapter 4, bricks, cement and steel alone cause ${f0(share(HOTSPOTS[0].kg + HOTSPOTS[1].kg + HOTSPOTS[2].kg))}% of the material emissions (Figure @fig:hotspots).`);
p(`India is starting to ask for these numbers:`);
ul([
  `<b>ECSBC 2024, Appendix A6</b> asks buildings to report embodied carbon in kg ${CO2e} per m² for stages A1–A3. It is voluntary for now [BEE, 2024].`,
  `<b>GRIHA v2019, Criterion 20</b> gives up to 5 points for lowering a building's global warming potential, using an LCA tool and EPDs [GRIHA Council, 2019].`,
  `<b>IGBC Net Zero Carbon</b> sets a design-stage limit of 700 kg ${CO2e}/m² [IGBC, n.d.].`,
  `<b>Carbon Credit Trading Scheme (2023)</b> sets emission-intensity targets for 186 cement plants [Ministry of Power, 2023; GHG Intensity Target Rules, 2025].`,
]);
p(`So designers, students and researchers increasingly need an embodied-carbon figure they can defend.`);

section("The problem");
p(`Indian studies calculate embodied carbon in two ways. Some use paid LCA software (SimaPro with the European ecoinvent database). Many use plain spreadsheets [Chaudhary and Akhtar, 2023; Akshatha et al., 2025]. The literature review (Chapter 2) found four recurring problems:`);
ol([
  `<b>Foreign or undocumented data.</b> Factors often come from European databases or unnamed "literature" [Bhagat and Savoikar, 2021; Patil et al., 2023; Talpur et al., 2023].`,
  `<b>Large spread.</b> The factor for fired clay brick varies about 6 times between sources, from 0.097 to 0.59 kg ${CO2e}/kg (Figure @fig:spread).`,
  `<b>Results that cannot be checked.</b> Of 9 Indian studies that printed enough data to recompute, only 2 reproduced exactly (Table @tab:repro).`,
  `<b>No uncertainty.</b> None of the studies in Table @tab:repro gives a range on its result. Among the Indian studies reviewed, only Tibrewal et al. (2023) did.`,
]);

section("Aim and objectives");
p(`The aim is a free calculator that gives the embodied carbon of Indian building materials, in which every number can be traced to a source and checked by hand. Table @tab:objectives lists the objectives.`);
table("objectives", "Objectives of the project and where each is addressed", ["No.", "Objective", "Addressed in"], [
  ["1", "Build an open library of emission factors for Indian materials, each cited to its table or page", `Section @sec:library (${LIB_TOTAL} factors)`],
  ["2", "Write a calculation engine for EN 15804 modules A1–A3, A4, A5, C1–C4 and D, with uncertainty", "Sections @sec:calc and @sec:uncertainty"],
  ["3", "Validate the engine by reproducing a published Indian study", "Section @sec:validation"],
  ["4", "Apply it to common Indian masonry and cement types, and test how results change with the choice of factor", "Sections @sec:masonry to @sec:cement"],
], { widths: [7, 65, 28] });

section("Scope");
table("scope", "Scope of the project", ["Included", "Not included, and why"], [
  ["Building materials (cement, concrete, steel, bricks, blocks, glass, finishes)", "Operational energy of the building: a separate field with its own tools"],
  [`One impact: global warming potential (kg ${CO2e})`, "Other impacts (acidification, water use): no open Indian data exists for them"],
  ["EN 15804 modules A1–A3, A4, A5, C1–C4 and D", "Use stage (B1–B7): needs a building's maintenance plan"],
  ["Free, publicly available data only", "Paid databases (ecoinvent, GaBi): others cannot check them"],
], { widths: [45, 55] });

section("Organisation of the thesis");
p(`Chapter 2 reviews LCA methods and Indian studies. Chapter 3 explains how the calculator works. Chapter 4 presents the validation and the results. Chapter 5 gives the conclusions, the limitations and future work.`);

/* ---------------------------------------------------------- chapter 2 */

chapter("Literature Review");
section("Life cycle assessment in brief");
p(`Life cycle assessment (LCA) adds up the environmental impact of a product over its life. ISO 14040 and ISO 14044 set the method in four steps. BIS has adopted both as Indian standards, IS/ISO 14040 and 14044 [BIS, 2009].`);
ol([
  `<b>Goal and scope:</b> what is studied, for which unit (for example, 1 m³ of wall), and which life stages count.`,
  `<b>Inventory:</b> how much of each material, fuel and transport is used.`,
  `<b>Impact assessment:</b> inventory × emission factors = impact.`,
  `<b>Interpretation:</b> which items matter most, and how certain the answer is.`,
]);
p(`For construction products, EN 15804 splits the life into modules (Figure @fig:modules). This project reports one impact, the global warming potential (GWP), in kg of ${CO2}-equivalent (kg ${CO2e}). It adds all greenhouse gases using their 100-year warming effect relative to ${CO2}.`);
figure("modules", figModules(), "Life-cycle modules of EN 15804 and the boundary used in this project");

section("Indian studies");
p(`Table @tab:studies lists Indian studies that were read in full. Most stop at the factory gate (A1–A3). None of the material-level studies counted end of life (C1–C4).`);
table("studies", "Indian embodied-carbon studies read in full", ["Study", "Topic", "How calculated", "Main result"], [
  ["Gettu et al. 2016", "Indian cements", "SimaPro + ecoinvent + plant data", `OPC 870, PPC 660, PSC 730 kg ${CO2}/t`],
  ["Gettu et al. 2018", "30 concrete mixes", "SimaPro + plant data", `OPC 930, PPC 690, PSC 550 kg ${CO2e}/t`],
  ["Pillai et al. 2019", "OPC, fly ash and LC3 concrete", "Plant data + ecoinvent", `M35 OPC concrete 335 kg ${CO2e}/m³`],
  ["Patil et al. 2023", "Geopolymer vs OPC concrete", "Spreadsheet", `306.8 vs 373.9 kg ${CO2e}/m³`],
  ["Singh et al. 2024", "Clay vs fly ash brick", "Hand calculation", `290 vs 43 g ${CO2} per brick`],
  ["Tibrewal et al. 2023", "Brick kiln energy, 500+ kilns", "Field survey", "Zigzag kilns use the least energy"],
  ["IFC 2017 (ICMD)", "National factor database", "GaBi software", `OPC 0.91; clay brick 0.32–0.59 kg ${CO2e}/kg`],
  ["Chaudhary & Akhtar 2023", "Residential building, Bihar", "Excel", `936 t ${CO2e} (A1–A5)`],
  ["Akshatha et al. 2025", "30-storey tower", "Spreadsheet, 4 data sets", `373 to 530 kg ${CO2e}/m²`],
  ["AEEE 2024", "Office building", "One Click LCA vs IFC data", "Results differ by about 17%"],
], { widths: [22, 25, 25, 28], small: true });

section("Where Indian factors come from");
p(`Three sources dominate, and each has a weakness.`);
ul([
  `<b>ecoinvent</b> (European, paid): a review of 71 South Asian building LCAs found it was always the database used [Talpur et al., 2023]. It is built on European production.`,
  `<b>IFC India Construction Materials Database (ICMD), 2017</b> [IFC, 2017]: the main Indian source. It is dated (2017, with 2012 grid electricity), gives only average values, and is marked "draft".`,
  `<b>Indian EPDs:</b> verified product data from manufacturers. They are still few; India had about 1.7% of the EPDs the International EPD System published in 2025 [International EPD System, 2025].`,
]);
p(`The sources can also disagree. ICMD ranks zigzag-kiln bricks as the worst kiln type (0.59 kg ${CO2e}/kg). A survey of more than 500 kilns found that zigzag kilns use the <i>least</i> firing energy, 1.19 MJ/kg against 1.30 MJ/kg for bull's trench kilns [Tibrewal et al., 2023; IFC, 2017].`);

section("How much results vary");
p(`The same input can differ several times between Indian sources (Figure @fig:spread). The choice of factor can therefore change a result more than the design choice being studied.`);
figure("spread", figSpread(), "Spread of the same input between Indian sources (highest value ÷ lowest value)");

section("Can published results be checked?", "repro");
p(`The arithmetic of every Indian study that printed its inventory and factors was redone (Table @tab:repro).`);
table("repro", "Reproducibility check of Indian studies", ["Study", "Inventory printed?", "Does the result reproduce?", "Uncertainty?"], [
  ["Chaudhary & Akhtar 2023", "Yes, in full", "Yes: 936.1 t vs 936 t", "No"],
  ["Patil et al. 2023", "Yes", "Yes, exactly", "No"],
  ["Bhagat & Savoikar 2021", "Yes", "About 97% (transport not given)", "No"],
  ["Pillai et al. 2019", "Yes", "Ranking yes; values 42–48 kg/m³ higher", "No"],
  ["Singh et al. 2024", "Partly", "No: 97.08 g/kg × 2.8 kg = 271.8 g, but 290 g printed", "No"],
  ["Ansari et al. 2026", "Yes", "No: formula gives 386.88, paper states 302.64", "No"],
  ["Padavala et al. 2026", "Yes", "No: cement alone (382.5) exceeds the total (368)", "No"],
  ["Omran et al. 2026", "Yes", "Cannot test: no factors printed", "No"],
  ["Kumbhar et al. 2014", "Yes", `No kg ${CO2e} reported`, "No"],
], { widths: [24, 17, 46, 13], small: true });
p(`Only Chaudhary and Akhtar printed a full bill of quantities, a source for every factor, and results by stage. This makes it the best case for validating a calculator (Section @sec:validation).`);

section("Existing tools");
table("tools", "Tools used in Indian studies", ["Tool", "What it is", "Limitation for Indian researchers"], [
  ["SimaPro [Gettu et al., 2016; Pillai et al., 2019]", "Commercial LCA software, usually with ecoinvent", "Paid; background data mostly European"],
  ["openLCA [Kar et al., 2026]", "Free LCA software", "Needs a database; the 395 Indian datasets that exist sit inside paid databases [Siluvai Antony and Jayaram, 2019]"],
  ["One Click LCA [AEEE, 2024]", "Commercial building LCA tool", "Foreign factors adjusted to the Indian grid"],
  ["EDGE (IFC) [IFC, 2017]", "Green-building app that hosts the ICMD", "ICMD gives averages only, last updated 2017"],
  ["Spreadsheets [Chaudhary and Akhtar, 2023]", "Hand-built Excel sheets", `Every study rebuilds the sheet; errors are hard to spot (Table @tab:repro)`],
], { widths: [27, 30, 43], small: true });

section("Research gap");
p(`No free tool combines (a) Indian factors that are each cited to a page, (b) working shown for every number, (c) a check against a published study, and (d) an uncertainty range. Several Indian reports ask for such open data: the CSIR-NEERI and CII national LCA database roadmap [Siluvai Antony and Jayaram, 2019], CEPT University's database framework [Rawal et al., 2024] and NITI Aayog's call for a public EPD register [NITI Aayog, 2026]. This project addresses the gap for one impact (GWP) and one sector (building materials).`);

/* ---------------------------------------------------------- chapter 3 */

chapter("Methodology");
section("Overall workflow");
p(`Cradle follows the four ISO 14044 steps (Figure @fig:workflow). The user sets the goal and boundary and enters the materials; the engine multiplies each quantity by a cited factor. Results come with their working, an uncertainty range and a report.`);
figure("workflow", figWorkflow(), "Workflow of the calculator, following the four steps of ISO 14044");

section("Goal and scope");
p(`Every project starts with three choices, which are saved with the project and printed in its report:`);
ul([
  `<b>Functional unit:</b> what the result refers to, such as "1 m³ of masonry" or "whole building". If a floor area is given, the result is also shown per m².`,
  `<b>System boundary:</b> which EN 15804 modules to include (Figure @fig:modules). A1–A3 is always on; A4, A5, C1–C4 and D can be switched on.`,
  `<b>Assumptions:</b> free text, for example the source of the quantities.`,
]);

section("Emission factor library", "library");
p(`The library holds ${LIB_TOTAL} A1–A3 factors, all for Indian products (Figure @fig:library). Four rules were followed:`);
ol([
  `<b>Free data only.</b> No ecoinvent, GaBi or other paid data, so anyone can check a value.`,
  `<b>Indian first.</b> Indian EPDs first, then Indian studies and Government of India data.`,
  `<b>Read from the document.</b> Each value was read from its PDF or spreadsheet, never from memory.`,
  `<b>Cited to a page.</b> Each factor stores its source, the table or page, the year and the licence.`,
]);
figure("library", figLibrary(), `The ${LIB_TOTAL} factors in the library, by material category`);
p(`Each factor carries a data-quality tag (Table @tab:quality). The results use it to show how much of a total rests on Indian data (Section @sec:share).`);
table("quality", "Data-quality tags and number of material factors", ["Tag", "Meaning", "Factors"], [
  ["Indian EPD", "Third-party verified declaration of a product made in India", "54"],
  ["Indian study", "Peer-reviewed or technical study of Indian production (e.g. IFC 2017)", "45"],
  ["Govt. of India", "Published by a government body (e.g. Ministry of Steel 2024)", "6"],
  ["Live India data", "Plant-level data fetched from Climate TRACE", "1"],
  ["Total", "", `${LIB_TOTAL}`],
], { widths: [20, 66, 14], total: true });
p(`Transport (A4) and site energy (A5) use separate factors (Table @tab:transport). Indian values are used where they exist; UK values (DESNZ 2025, open licence) fill the gaps and are labelled as proxies.`);
table("transport", "Main transport and site-energy factors", ["Factor", "Value", "Unit", "Source"], [
  ["Heavy truck, >12 t, diesel (India)", "0.7375", `kg ${CO2e} per vehicle-km`, "India GHG Program 2015, p.10"],
  ["Medium truck, <12 t, diesel (India)", "0.5928", `kg ${CO2e} per vehicle-km`, "India GHG Program 2015, p.10"],
  ["Rail freight, Indian Railways", "0.00996", `kg ${CO2e} per t-km`, "India GHG Program 2015, p.7"],
  ["Grid electricity, India FY2025-26", "0.6751", `kg ${CO2} per kWh`, "CEA CO<sub>2</sub> Baseline Database v22"],
  ["Diesel burned on site", "2.66155", `kg ${CO2e} per litre`, "DESNZ 2025 (UK proxy)"],
], { widths: [33, 12, 24, 31], small: true });

section("Calculation", "calc");
p(`The engine is linear: every number is a quantity times a factor. For each material line ${v("i")}:`);
eq("a13", `A1–A3<sub>${v("i")}</sub> = ${v("Q")}<sub>${v("i")}</sub> × ${v("EF")}<sub>${v("i")}</sub>`);
p(`where ${v("Q")} is the quantity in the factor's declared unit (kg, t, m³ or piece) and ${v("EF")} is the factor. If the user enters a different unit, the engine converts it with the factor's density or unit mass. If no conversion exists, it shows a warning instead of guessing.`);
p(`Transport to site (A4) uses the mass ${v("m")} (t) and the distance ${v("d")} (km). Rail and ship factors are per tonne-km (Equation @eq:a4tkm). Truck factors are per vehicle-km, so the mass is first turned into trips using the truck's payload ${v("P")} in tonnes (Equation @eq:a4vkm):`);
eq("a4tkm", `A4<sub>${v("i")}</sub> = ${v("m")}<sub>${v("i")}</sub> × ${v("d")} × ${v("EF")}<sub>t·km</sub>`);
eq("a4vkm", `A4<sub>${v("i")}</sub> = (${v("m")}<sub>${v("i")}</sub> ÷ ${v("P")}) × ${v("d")} × ${v("EF")}<sub>vehicle·km</sub>`);
p(`Construction (A5) counts the wasted share ${v("w")} of each material, plus the energy ${v("E")} used on site (electricity, diesel, water):`);
eq("a5", `A5 = Σ ${v("w")}<sub>${v("i")}</sub> × (A1–A3<sub>${v("i")}</sub> + A4<sub>${v("i")}</sub>) + Σ ${v("E")}<sub>${v("j")}</sub> × ${v("EF")}<sub>${v("j")}</sub>`);
p(`End of life (C1–C4) uses the product's own EPD value when it declares one; otherwise the mass in tonnes times a route factor for landfill, recycling or incineration:`);
eq("c", `C1–C4<sub>${v("i")}</sub> = ${v("m")}<sub>${v("i")}</sub> × ${v("EF")}<sub>route</sub>`);
p(`Module D (benefits from recycling) is shown separately and never added to the total, as EN 15804 requires:`);
eq("total", `Total = A1–A3 + A4 + A5 + C1–C4`);
p(`For every line the engine also writes out its working, for example "1,540 kg × 0.39 kg ${CO2e}/kg = 600.5 kg ${CO2e}". Any number can therefore be checked by hand.`);

section("Material quantities from CPWD");
p(`For common work items, the materials per unit of work come from the CPWD Delhi Analysis of Rates (DAR) 2014 (Table @tab:cpwd). Volumes and brick counts are converted to kg with densities from IS 875 (Part 1), IS 1077 and IFC 2017 (Table @tab:conversions).`);
table("cpwd", "CPWD work items used in the calculator", ["Work item (per m³)", "Materials per m³ of work", "CPWD source"], [
  ["Clay brickwork, mortar 1:6", "494 bricks + 0.25 m³ mortar", "DAR 2014 item 6.4.2, p.234"],
  ["Fly ash–lime (FaL-G) brickwork, mortar 1:6", "487 bricks + 0.22 m³ mortar", "DAR 2014 item 6.34.2, p.255"],
  ["AAC block masonry, mortar 1:4", "1 m³ blocks + 0.15 m³ mortar + 13.2 kg steel", "DAR 2014 item 6.38, pp.257–258"],
  ["M25 design-mix concrete", "0.33 t cement + 0.425 m³ sand + 0.85 m³ aggregate", "DAR 2014 item 5.33.1, p.207"],
], { widths: [34, 38, 28], small: true });
table("conversions", "Conversions from CPWD quantities to kg", ["Conversion", "Value", "Source"], [
  ["Mortar 1:6, per m³", "0.25 t cement + 1.07 m³ sand", "DAR 2014 item 3.11, p.119"],
  ["Mortar 1:4, per m³", "0.38 t cement + 1.07 m³ sand", "DAR 2014 item 3.9, p.118"],
  ["Sand density", "1,570 kg/m³ (midpoint of 1,540–1,600)", "IS 875 (Part 1), Table 1"],
  ["Coarse aggregate density", "1,735 kg/m³ (midpoint of 1,600–1,870)", "IS 875 (Part 1), Table 1"],
  ["Brick mass", `230 × 110 × 70 mm × 1,760 kg/m³ = ${BRICK_KG.toFixed(2)} kg`, "IS 1077; IFC 2017, Table 18"],
  ["AAC density", "500 kg/m³", "IFC 2017, Table 18"],
], { widths: [28, 44, 28], small: true });
p(`Two tests protect these numbers. The cement in each item matches CPWD's separately published cement coefficients (DSR 2014). The mass of 1 m³ of clay brickwork comes out within 10% of the 1,920 kg/m³ given in IS 875.`);

section("Uncertainty", "uncertainty");
p(`Where a source gives a range (low to high) for a factor, the engine runs a Monte Carlo simulation:`);
ol([
  `Each ranged factor is drawn from a triangular distribution: lowest at the low value, peak at the stated value, back to zero at the high value.`,
  `The project is recalculated with the drawn values. This is repeated 5,000 times.`,
  `The 2.5th and 97.5th percentiles of the 5,000 totals give a 95% range.`,
]);
p(`The random generator uses a fixed seed (42), so the same project always gives the same range. Factors without a range stay fixed, and the result states what share of the total was varied. At present only 9 of the ${LIB_TOTAL} factors have a published range (for example, the mean of four Indian OPC EPDs, 921 to 1,010 kg ${CO2e}/t). The ranges are therefore narrow; Section @sec:limitations treats this as a limitation.`);

section("How much of a result is Indian data?", "share");
p(`The engine splits each total by the quality tag of the factor behind every kilogram. A result can then say, for example, "83% rests on Indian studies, 17% on foreign proxies". This makes the strength of the data visible next to the number.`);

section("Entering the inventory");
p(`There are three ways to enter materials (Table @tab:entry). All three end in the same review table, where the user confirms each line.`);
table("entry", "Ways to enter the inventory", ["Method", "How it works", "Who decides the numbers"], [
  ["Manual entry", "Pick a material from the library and type the quantity and unit", "The user"],
  ["BoQ import", "Upload a CPWD-style bill of quantities (CSV or Excel). Units such as cum, sqm, MT, qtl, bags and nos are read, and each row is matched to a library material", "The BoQ; the user confirms each match"],
  ["AI draft", `Type or speak a short description, e.g. "230 mm brick wall, 10 m²". A language model (Groq, gpt-oss-120b) works out only the size of the work item (10 m² × 0.23 m = 2.3 m³). The CPWD coefficients in Table @tab:cpwd turn it into materials`, "The model gives only the size; materials and factors come from the cited tables"],
], { widths: [15, 55, 30], small: true });
p(`The AI is never allowed to supply an emission factor or a material quantity per unit of work. In an early test where it did, the brick and mortar quantities were wrong by about 2 times.`);
p(`Figure @fig:aidraft shows a real draft for "230 mm thick clay brick wall in cement mortar 1:6, 3 m high and 4 m long". The model gave only the size (3 m × 4 m × 0.23 m = 2.76 m³). The bricks, cement and sand then follow from CPWD DAR 2014 item 6.4.2, and each line shows this working before the user adds it to the ledger.`);
screen("aidraft", "ai-draft.jpg", "localhost:3000/import", "AI draft of a brick wall: the model sizes the wall; CPWD coefficients give the materials, with the working on each line");

section("Software and testing");
p(`Cradle is a web app built with Next.js and TypeScript. The calculation engine is separate from the user interface, so it can be tested on its own. Projects are saved in the user's browser and can be exported as a project file, an Excel workbook with live formulas, a printable report and a BibTeX reference list. Table @tab:tests lists the automated tests.`);
table("tests", "Automated tests (all 49 pass)", ["Test file", "What it checks", "Tests"], [
  ["Engine", "Each module's equation, unit conversion, boundary switches, D kept out of the total, Monte Carlo", "14"],
  ["AI draft", "The model's answer is checked and expanded only into cited work items", "9"],
  ["CPWD work items", "Quantities match CPWD's cement table; brickwork mass within 10% of IS 875", "7"],
  ["BoQ import", "Column detection and Indian BoQ units", "6"],
  ["Library", "Every factor has a source, a page and a licence; ranges contain the value", "5"],
  ["Validation", `Published study reproduced (Section @sec:validation)`, "3"],
  ["Excel export", "Every formula in the workbook gives the engine's value", "3"],
  ["Number input", "Typed numbers are read correctly", "2"],
  ["Total", "", "49"],
], { widths: [20, 68, 12], total: true, small: true });

/* ---------------------------------------------------------- chapter 4 */

chapter("Results and Discussion");
section("The calculator");
p(`Cradle works, and all 49 tests pass (Table @tab:tests). Table @tab:screens lists its main screens. The figures below are screenshots of the running app with real data: the three masonry walls of Section @sec:masonry and the validated building of Section @sec:validation.`);
table("screens", "Main screens of Cradle", ["Screen", "What the user does there", "Figure"], [
  ["Home", "Opens a worked example or a saved project; describes a new project for the AI draft", "@fig:home"],
  ["Ledger", "Adds materials, transport, wastage and site energy; sees a running total line by line", "@fig:ledger"],
  ["Results", "Sees totals by module, the largest contributors, the uncertainty range and the Indian-data share", "@fig:results"],
  ["Compare", "Puts alternatives (e.g. three wall types) on one scale", "@fig:compare"],
  ["Report", "Prints an ISO 14044-style report; downloads Excel, BibTeX or the project file", "@fig:report"],
  ["Library", `Browses the ${LIB_TOTAL} factors, each with its source and page`, "@fig:library-screen"],
], { widths: [14, 74, 12] });
p(`The home page (Figure @fig:home) lists the projects saved in the browser with their totals. A one-line description starts an AI draft, and worked examples open with one click.`);
screen("home", "home.jpg", "", "Home page of Cradle with four saved projects", { laptop: true });
p(`The ledger (Figure @fig:ledger) is the main working screen. Each line shows the material, its quantity and unit, a tag for the kind of data behind its factor ("Indian study", "Proxy" and so on), its result and a running total; opening a line shows its working and its source. The results screen (Figure @fig:results) gives the total, the split by module, the biggest lines and the share of the total that rests on Indian data. For the validated building the total is ${f0((VALIDATION_A13 + VALIDATION_A5) / 1000)} t ${CO2e} (A1–A3 and A5), and 83.3% of it rests on Indian data.`);
screen("ledger", "ledger.jpg", "localhost:3000/project/…", "Ledger of the validated building (Section @sec:validation): 78 material lines with quantity, data tag, result and running total");
screen("results", "results.jpg", "localhost:3000/project/…", `Results of the validated building: ${f0((VALIDATION_A13 + VALIDATION_A5) / 1000)} t ${CO2e} in total, the biggest lines and the Indian-data share`);
p(`The compare screen (Figure @fig:compare) puts saved projects on one scale. Here the three masonry walls of Section @sec:masonry are compared: AAC and fly ash–lime brick masonry come out ${f0((1 - WALLS[2].total / WALLS[0].total) * 100)}% and ${f0((1 - WALLS[1].total / WALLS[0].total) * 100)}% below clay brick masonry. The report screen (Figure @fig:report) prints the project in the order ISO 14044 asks for: goal, scope, inventory with a source for every factor, results and interpretation. The library (Figure @fig:library-screen) lists every factor with its source, page and data tag, so a user can check any value before using it.`);
screen("compare", "compare.jpg", "localhost:3000/project/…", "Compare screen: 1 m³ of clay brick, AAC block and fly ash–lime brick masonry on one scale");
screen("report", "report.jpg", "localhost:3000/project/…", "Report screen: an ISO 14044-style report of the validated building");
screen("library-screen", "library.jpg", "localhost:3000/library", "Library screen: Indian cement factors, each with its EPD, page and data tag");

section("Validation against a published study", "validation");
p(`The engine was checked against Chaudhary and Akhtar (2023), who studied residential quarters at a hospital in Bhojpur, Bihar. They turned a CPWD bill of quantities into 78 materials and gave each an emission factor with its source.`);
p(`<b>Method.</b> All 78 materials were entered with the paper's own quantities, units and factors. Because the data is the same, any difference can only come from the calculation itself: units, conversions or sums. The paper uses mixed units (1000 bricks, quintals, packs of 10 and 100, litres, metres), so the unit conversions were tested too. Table @tab:validation gives the result.`);
table("validation", "Validation result", ["Stage", `Published (kg ${CO2e})`, `Cradle (kg ${CO2e})`, "Difference"], [
  ["A1–A3 material production", "899,412.37", "899,412.37", "0.00"],
  ["A5 on-site construction", "12,075.01", "12,074.60", "0.41 kg (0.003%)"],
  ["A4 transport", "24,631", "not compared", "see below"],
], { widths: [34, 22, 22, 22] });
ul([
  `<b>A1–A3:</b> every one of the 78 lines matches the paper's Table S4 after unit conversion, and so does the total.`,
  `<b>A5:</b> the 0.41 kg gap comes from one welding item that the paper gives per cm, a unit the calculator does not have.`,
  `<b>A4:</b> the paper rounds truck trips up to whole trips for each material group, while Cradle shares trips in proportion to mass. A4 is 2.6% of the total and is left out of this check. Adding the paper's trip method is listed as future work (Section @sec:future).`,
]);
p(`Figure @fig:hotspots shows where the building's A1–A3 emissions come from. Bricks and cement together make up ${f0(share(HOTSPOTS[0].kg + HOTSPOTS[1].kg))}%, so their factors matter most. The data-share check (Section @sec:share) finds that 83.3% of this total rests on Indian data (the IFC database) and 16.7% on foreign factors the paper used.`);
figure("hotspots", figHotspots(), `A1–A3 emissions of the validated building by material (total ${f1(VALIDATION_A13 / 1000)} t ${CO2e})`);

section("First application: 1 m³ of masonry", "masonry");
p(`Three common wall materials were compared using the CPWD quantities in Table @tab:cpwd and factors from the library. The boundary is A1–A3 and the unit is 1 m³ of masonry (Figure @fig:walls).`);
figure("walls", figWalls(), `Embodied carbon of 1 m³ of three masonry types, split by ingredient (kg ${CO2e}, A1–A3)`);
p(`Fly ash–lime brick and AAC block masonry come out at about half of clay brick masonry. The bricks or blocks themselves cause most of each total. Mortar cement adds ${f0(WALLS[1].parts.cement)}–${f0(WALLS[0].parts.cement)} kg, and the AAC bed-joint steel adds ${f0(WALLS[2].parts.steel)} kg.`);
p(`This comparison is per m³ of masonry. Walls of different materials differ in thickness, strength and thermal behaviour, so a design decision should compare walls that do the same job. That comparison is left for future work (Section @sec:future).`);

section("How much does the brick factor matter?", "kiln");
p(`The clay-brick result above uses the IFC India average (0.39 kg ${CO2e}/kg). IFC also gives a factor for each kiln type. Keeping the CPWD quantities fixed and changing only the brick factor gives Equation @eq:wall and Figure @fig:kilns:`);
eq("wall", `Wall = ${f1(CLAY_BRICK_KG)} kg bricks × ${v("EF")}<sub>brick</sub> + ${f1(CLAY_MORTAR)} kg ${CO2e} (mortar)`);
figure("kilns", figKilns(), `1 m³ of clay brickwork for each IFC kiln factor (kg ${CO2e}; brick factor in kg ${CO2e}/kg in brackets)`);
p(`The kiln assumption alone changes the result by ${(KILNS[4].wall / KILNS[0].wall).toFixed(1)} times (${f0(KILNS[0].wall)} to ${f0(KILNS[4].wall)} kg ${CO2e}/m³). This is larger than the gap between clay brick and AAC in Figure @fig:walls. The data also conflict: IFC ranks the zigzag kiln worst, but a field survey of more than 500 kilns found that zigzag kilns use the least energy [Tibrewal et al., 2023]. A result for brick masonry should therefore always state which brick factor was used.`);

section("Cement type", "cement");
p(`Cement is the second-largest item in Figure @fig:hotspots. Indian EPDs give values for four cement types (Figure @fig:cements).`);
figure("cements", figCements(), "Embodied carbon of Indian cement types from manufacturer EPDs (dot: mean; line: lowest to highest EPD)");
p(`Slag cement (PSC) averages ${f0(CEMENTS[3].mean)} kg ${CO2e}/t, less than half of OPC at ${f0(CEMENTS[0].mean)}. Blended cements replace part of the clinker, the high-carbon ingredient, with fly ash or slag. Even within one type the brands differ: OPC ranges from ${f0(CEMENTS[0].low)} to ${f0(CEMENTS[0].high)} kg ${CO2e}/t across four Indian EPDs. These EPD ranges are what the Monte Carlo analysis samples from (Section @sec:uncertainty).`);

/* ---------------------------------------------------------- chapter 5 */

chapter("Conclusion and Future Works");
section("Conclusions");
ol([
  `A free calculator, Cradle, now computes the embodied carbon of Indian building materials for EN 15804 modules A1–A3, A4, A5, C1–C4 and D, and shows the working for every number.`,
  `Its library holds ${LIB_TOTAL} factors for Indian products, each cited to its table or page; 54 of them come from Indian EPDs.`,
  `It reproduces a published Indian building study: A1–A3 exactly (899,412.37 kg ${CO2e}) and A5 within 0.41 kg.`,
  `For 1 m³ of masonry, fly ash–lime brick (${f0(WALLS[1].total)} kg ${CO2e}) and AAC block (${f0(WALLS[2].total)}) come out at about half of clay brick (${f0(WALLS[0].total)}).`,
  `The choice of brick factor alone moves the clay-brick result from ${f0(KILNS[0].wall)} to ${f0(KILNS[4].wall)} kg ${CO2e}/m³. Reporting the factor and its source is therefore as important as the result.`,
]);

section("Limitations", "limitations");
p(`Table @tab:limitations lists the limits of the present work and the step that would remove each one. Section @sec:future describes these steps.`);
table("limitations", "Limitations of the present work", ["Limitation", "Effect", "Next step"], [
  [`Only 9 of ${LIB_TOTAL} factors have a published range`, "Uncertainty ranges are narrow; for walls they cover only 9–16% of the total", "Add ranges wherever a source gives several values"],
  ["Transport (A4) not yet validated", "A4 results are not yet checked against a study", "Add the paper's whole-trip method and re-check"],
  ["Brick and block factors rely on IFC 2017", "Dated averages; the kiln ranking conflicts with field data", "Add Indian EPDs and field studies as they appear"],
  ["One validation case", "One building type only", "Add a second validation case"],
  ["Masonry compared per m³", "Not walls that do the same job", "Compare walls per m² of equal function"],
  ["Licences", `CEA asks for permission before public reuse; IFC and India GHG Program data are "all rights reserved"`, "Cite with attribution; ask CEA before public release"],
  ["GWP only", "Other impacts not covered", "Out of scope: no open Indian data"],
], { widths: [30, 38, 32], small: true });

section("Future Works", "future");
p(`This work gives a working, validated calculator and a first set of results. The following steps would make it more reliable and more useful to Indian researchers.`);
ol([
  `<b>More validation cases.</b> The engine is checked against one building. Patil et al. (2023) printed every input for two concrete mixes, and its result reproduces exactly by hand, so it can be added as a second test. Pillai et al. (2019) uses Indian plant data; its ranking of mixes should match, and the constant gap of 42–48 kg/m³ (Table @tab:repro) should be explained.`,
  `<b>Transport to site (A4).</b> Add the whole-truck-trip method used by Chaudhary and Akhtar (2023), so that A4 can also be checked against their 24.6 t ${CO2e}.`,
  `<b>Wider uncertainty.</b> Only 9 of the ${LIB_TOTAL} factors carry a range today. Where a source gives several values for one product, such as the four Indian EPDs for OPC, the range can be stored, so the Monte Carlo analysis covers more of each total.`,
  `<b>Walls that do the same job.</b> Section @sec:masonry compares 1 m³ of masonry. A fairer comparison is per m² of wall with the same function, for example a 230 mm clay brick wall against an AAC block wall of similar strength, with transport, wastage and end of life included.`,
  `<b>Sensitivity to method choices.</b> Test how results change with the brick kiln type (Section @sec:kiln), the year of the CEA grid factor (0.7272 kg ${CO2}/kWh in FY2023-24 against 0.6751 in FY2025-26), and how much of a power plant's or steel plant's emissions is assigned to fly ash and slag, which are by-products.`,
  `<b>Indian end-of-life data.</b> End of life (C1–C4) now uses UK proxy factors (DESNZ 2025), because no open Indian dataset exists. Indian data on the recycling of construction and demolition waste, and on the reuse of fly ash and slag, would make modules C1–C4 and D more representative.`,
  `<b>More Indian EPDs.</b> As Indian manufacturers publish new EPDs, especially for bricks and blocks, they can replace the 2017 IFC averages in the library.`,
]);

/* ---------------------------------------------------------- references */

const REFS = [
  `AEEE and Saint-Gobain Research India (2024). <i>Life Cycle Assessment of Carbon Emissions: Progress and Barriers in Indian Building Sector.</i> Alliance for an Energy Efficient Economy. https://aeee.in/wp-content/uploads/2024/08/life-cycle-assessment-of-carbon-emissions.pdf`,
  `Akshatha, K.G., Palaniappan, S., Pradeep Kumara Rao, M.K. (2025). Embodied carbon variability in Indian high-rise residential buildings: a case-based assessment. <i>Proc. 13th World Construction Symposium</i>, 623–634. doi:10.31705/WCS.2025.47`,
  `Ansari, S.S., Ansari, M.A., Ibrahim, S.M. (2026). Explainable predictive modelling of sustainable slag–fly ash based geopolymer concrete with life cycle and carbon-neutrality assessment. <i>Bulletin of Computational Intelligence</i>, 2(1), 54–82. doi:10.53941/bci.2026.100004`,
  `BEE (2024). <i>Energy Conservation and Sustainable Building Code (ECSBC) 2024</i>, Appendix A6. Bureau of Energy Efficiency, Government of India.`,
  `Bhagat, G.V., Savoikar, P.P. (2021). Auditing carbon reduction potential of green concrete using life cycle assessment methodology. <i>IOP Conference Series: Earth and Environmental Science</i>, 850, 012002. doi:10.1088/1755-1315/850/1/012002`,
  `BIS (2009). IS/ISO 14040:2006 and IS/ISO 14044:2006, Environmental management: life cycle assessment. Bureau of Indian Standards.`,
  `BIS. IS 875 (Part 1):1987, Dead loads: unit weights of building materials; IS 1077:1992, Common burnt clay building bricks; IS 12894:2002, Pulverized fuel ash-lime bricks. Bureau of Indian Standards.`,
  `CEA (2026). <i>CO<sub>2</sub> Baseline Database for the Indian Power Sector</i>, Version 22.0. Central Electricity Authority, Ministry of Power.`,
  `CEN (2019). EN 15804:2012+A2:2019, Sustainability of construction works: Environmental product declarations, core rules for the product category of construction products.`,
  `Chaudhary, A., Akhtar, A. (2023). Template for evaluating cradle-to-site environmental life cycle impacts of buildings in India. <i>ACS Environmental Au</i>, 3(2), 94–104. doi:10.1021/acsenvironau.2c00035`,
  `Climate TRACE (2025). Asset-level emissions inventory, API v6, India. CC BY 4.0. https://climatetrace.org`,
  `CPWD (2014). <i>Analysis of Rates for Delhi</i>, Vol. 1, and <i>Delhi Schedule of Rates 2014</i>. Central Public Works Department, Government of India. https://cpwd.gov.in/WriteReadData/Publication/DAR14-Vol1.pdf`,
  `DESNZ (2025). <i>Greenhouse gas reporting: conversion factors 2025.</i> UK Department for Energy Security and Net Zero. Open Government Licence v3.0.`,
  `Gettu, R., Patel, A., Rathi, V., Prakasan, S., Basavaraj, A.S., Maity, S. (2016). Sustainability assessment of cements and concretes in the Indian context: influence of supplementary cementitious materials. <i>Proc. SCMT4</i>, 1061–1068. doi:10.18552/2016/SCMT4S299`,
  `Gettu, R., Pillai, R.G., Santhanam, M., Basavaraj, A.S., Rathnarajan, S., Dhanya, B.S. (2018). Sustainability-based decision support framework for choosing concrete mixture proportions. <i>Materials and Structures</i>, 51, 165. doi:10.1617/s11527-018-1291-z`,
  `GHG Intensity Target Rules (2025). Greenhouse Gases Emission Intensity Target Rules, notified 8 October 2025, under the Carbon Credit Trading Scheme. Government of India.`,
  `GRIHA Council (2019). <i>GRIHA v2019 Manual</i>, Volume 1, Criterion 20. https://www.grihaindia.org`,
  `IFC (2017). <i>India Construction Materials Database of Embodied Energy and Global Warming Potential: Methodology Report</i>, v1.0 (prepared by thinkstep). International Finance Corporation. https://edgebuildings.com/ifc-india-construction-materials-database-methodology-report/`,
  `IGBC (n.d.). <i>Net Zero Carbon rating system.</i> Indian Green Building Council. https://igbc.in`,
  `India GHG Program (2015). <i>India Specific Road Transport Emission Factors</i> and <i>India Specific Rail Transport Emission Factors</i>, Version 1.0. WRI India, CII and TERI.`,
  `International EPD System (2025). EPD development 2025. https://www.environdec.com`,
  `International EPD System (various years). Environmental Product Declarations of Indian products used in the factor library (cement, concrete, steel, glass, gypsum board, paint, aluminium, brick and paver EPDs of UltraTech, ACC, Ambuja, My Home, JSW, Tata Steel, SAIL, Saint-Gobain and others). The full list with registration numbers is exported by Cradle as a BibTeX file.`,
  `Kar, S., Mandal, A.K., Sengupta, H. (2026). Sustainability assessment and life cycle analysis of high-volume fly ash and geopolymer concrete. <i>Research Square</i> (preprint, not peer-reviewed). doi:10.21203/rs.3.rs-8440633/v1`,
  `Kumbhar, S., Kulkarni, N., Rao, A.B., Rao, B. (2014). Environmental life cycle assessment of traditional bricks in western Maharashtra, India. <i>Energy Procedia</i>, 54, 260–269. doi:10.1016/j.egypro.2014.07.269`,
  `Ministry of Power (2023). Carbon Credit Trading Scheme, 2023, S.O. 2825(E), 28 June 2023. Gazette of India.`,
  `Ministry of Steel (2024). <i>Greening the Steel Sector in India: Roadmap and Action Plan</i>, Table 1.7. Government of India.`,
  `NITI Aayog (2026). <i>Scenarios Towards Viksit Bharat and Net Zero: Sectoral Insights, Buildings.</i> Government of India.`,
  `Omran, S., Sisupalan, S., Alyaseen, A., Khan, A.H. (2026). Utilization of electronic plastic waste as fine aggregate with and without silica fume in concrete: experimentation and life cycle assessment. <i>Scientific Reports</i>, 16, 5723. doi:10.1038/s41598-026-35491-9`,
  `Padavala, S.S.A.B., Avudaiappan, S., Prathipati, S.R.R.T., Paluri, Y., Sainath, V., Kumara, A.M. (2026). Integrated experimental, machine learning, and life-cycle assessment of fly ash–silica fume based self-compacting geopolymer concrete. <i>Scientific Reports</i>, 16, 12845. doi:10.1038/s41598-026-43052-3`,
  `Patil, S., Joshi, D.A., Menon, R., Wadhwa, L.K. (2023). Environmental impact assessment of fly ash and GGBS based geopolymer concrete in road construction. <i>E3S Web of Conferences</i>, 405, 03021. doi:10.1051/e3sconf/202340503021`,
  `Pillai, R.G., Gettu, R., Santhanam, M., Rengaraju, S., Dhandapani, Y., Rathnarajan, S., Basavaraj, A.S. (2019). Service life and life cycle assessment of reinforced concrete systems with limestone calcined clay cement (LC3). <i>Cement and Concrete Research</i>, 118, 111–119. doi:10.1016/j.cemconres.2018.11.019`,
  `Rawal, R., Shukla, Y., Shivani, S., Nathani, S., Kumar, S., Asrani, S. (2024). Developing an embodied energy database for construction materials in India. <i>Energise 2023 Proceedings</i>, 117–126. doi:10.62576/WKVZ5438`,
  `Siluvai Antony, P., Jayaram, N. (2019). <i>Development of National LCA Database Roadmaps: Final Roadmap Report for India.</i> CSIR-NEERI and CII for UNEP Life Cycle Initiative. doi:10.5281/zenodo.18509407`,
  `Singh, S., Maiti, S., Bisht, R.S., Panigrahi, S.K., Yadav, S. (2024). Large CO<sub>2</sub> reduction and enhanced thermal performance of agro-forestry, construction and demolition waste based fly ash bricks for sustainable construction. <i>Scientific Reports</i>, 14, 8368. doi:10.1038/s41598-024-59012-8`,
  `Talpur, B.D., Liuzzi, S., Rubino, C., Cannavale, A., Martellotta, F. (2023). Life cycle assessment and circular building design in South Asian countries: a review. <i>Buildings</i>, 13, 3045. doi:10.3390/buildings13123045`,
  `Tibrewal, K., Venkataraman, C., Maithel, S., et al. (2023). Reconciliation of energy use disparities in brick production in India. <i>Nature Sustainability</i>, 6, 1248–1257. doi:10.1038/s41893-023-01165-x`,
];
toc.push({ lvl: 0, num: "", title: "References", find: "REFERENCES" });
add(`<h1 class="chapter">REFERENCES</h1><div class="refs">${REFS.map((r) => `<p>${r.replace(/(https?:\/\/\S+)/g, '<span class="url">$1</span>')}</p>`).join("")}</div>`);

/* ---------------------------------------------------------- styles */

const BASE_CSS = `
@page { size: A4; margin: 2.5cm 2.5cm 2.5cm 3cm; }
html { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; line-height: 1.5; text-align: justify; hyphens: none; }
p { margin: 0 0 8pt; orphans: 2; widows: 2; }
ul, ol { margin: 0 0 8pt; padding-left: 22pt; }
li { margin-bottom: 3pt; }
sub { font-size: 70%; vertical-align: -0.25em; line-height: 0; }
.caption { text-align: center; font-style: italic; font-size: 11pt; line-height: 1.35; margin: 5pt 0 0; }
svg text { font-family: "Times New Roman", Times, serif; }
`;

const BODY_CSS = `
@page { @bottom-center { content: counter(page); font-family: "Times New Roman", Times, serif; font-size: 11pt; font-style: italic; } }
h1.chapter { font-size: 15pt; font-weight: bold; margin: 0 0 14pt; break-before: page; break-after: avoid; }
h1.chapter:first-child { break-before: auto; }
h2 { font-size: 13pt; font-weight: bold; margin: 14pt 0 6pt; break-after: avoid; }
figure { margin: 10pt 0 14pt; break-inside: avoid; }
figure svg { display: block; width: 100%; height: auto; }
.tbl { margin: 8pt 0 14pt; break-inside: avoid; }
table.t { width: 100%; border-collapse: collapse; font-size: 11pt; line-height: 1.3; text-align: left; border-top: 1.2pt solid #000; border-bottom: 1.2pt solid #000; }
.tbl.small table.t { font-size: 10.5pt; }
table.t th { font-weight: bold; border-bottom: 0.7pt solid #000; padding: 4pt 5pt; vertical-align: bottom; }
table.t td { padding: 3pt 5pt; vertical-align: top; }
table.t tr.total td { border-top: 0.7pt solid #000; font-weight: bold; }
.eq { display: flex; justify-content: space-between; align-items: center; margin: 4pt 0 10pt 12%; break-inside: avoid; }
.eq .eqn { font-size: 12pt; }
.browser { width: 84%; margin: 0 auto; border: 0.8pt solid #b4b4b4; border-radius: 7pt; overflow: hidden; background: #fff; box-shadow: 0 1.5pt 5pt rgba(0,0,0,0.16); }
.browser .bar { display: flex; align-items: center; height: 17pt; padding: 0 9pt; background: #ececec; border-bottom: 0.6pt solid #cfcfcf; }
.browser .dots { display: flex; gap: 3.5pt; width: 60pt; }
.browser .dots i { display: block; width: 6.5pt; height: 6.5pt; border-radius: 50%; background: #ff5f57; }
.browser .dots i:nth-child(2) { background: #febc2e; }
.browser .dots i:nth-child(3) { background: #28c840; }
.browser .url { flex: 0 1 55%; margin: 0 auto; transform: translateX(-30pt); height: 11.5pt; line-height: 11.5pt; border-radius: 3.5pt; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 7pt; color: #555; text-align: center; }
.browser img, .laptop img { display: block; width: 100%; }
.laptop { width: 76%; margin: 4pt auto 0; }
.laptop .lid { position: relative; padding: 13pt 11pt 11pt; background: #1d1d1f; border-radius: 12pt 12pt 0 0; }
.laptop .cam { position: absolute; top: 5pt; left: 50%; width: 4pt; height: 4pt; margin-left: -2pt; border-radius: 50%; background: #3a3a3c; }
.laptop .base { position: relative; height: 10pt; margin: 0 -6%; background: linear-gradient(#e4e4e6, #a9a9ad); border-radius: 0 0 12pt 12pt; }
.laptop .base::before { content: ""; position: absolute; top: 0; left: 41%; width: 18%; height: 3.5pt; background: #c2c2c6; border-radius: 0 0 5pt 5pt; }
.refs p { text-align: left; padding-left: 22pt; text-indent: -22pt; margin-bottom: 6pt; line-height: 1.35; font-size: 11.5pt; }
.refs .url { word-break: break-all; }
`;

const FRONT_CSS = `
.page { height: 24.6cm; break-after: page; position: relative; }
.page:last-child { break-after: auto; }
.center { text-align: center; }
.title-page { display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; }
.title-page .ttl { font-size: 19pt; font-weight: bold; line-height: 1.35; margin-top: 4pt; }
.title-page .it { font-style: italic; line-height: 1.5; }
.title-page .b { font-weight: bold; }
.logo { width: 3.2cm; }
.dept { font-weight: bold; line-height: 1.6; text-align: center; }
.fm-head { text-align: center; font-weight: bold; text-decoration: underline; font-size: 14pt; margin: 0 0 18pt; }
.sign { display: flex; justify-content: space-between; margin-top: 40pt; line-height: 1.5; }
.sig-right { text-align: left; }
.sig-line { border-top: 0.7pt solid #000; width: 6cm; margin-bottom: 4pt; padding-top: 0; height: 0; }
.ack-sign { text-align: right; font-weight: bold; margin-top: 30pt; line-height: 1.5; }
.toc { line-height: 1.45; }
.toc .row { display: flex; align-items: baseline; margin: 0; }
.toc .row.l0 { font-weight: bold; margin-top: 9pt; }
.toc .row.l1 { padding-left: 18pt; }
.toc .row .lbl { padding-right: 4pt; }
.toc .row .num { min-width: 30pt; display: inline-block; }
.toc .row .dots { flex: 1; border-bottom: 1.2pt dotted #555; margin: 0 4pt 4pt; }
.toc .row.l0 .dots { border-bottom-color: transparent; }
.toc .row .pg { min-width: 18pt; text-align: right; }
.lst .row { display: flex; align-items: flex-end; margin: 0 0 6pt; line-height: 1.35; }
.lst .row .num { min-width: 70pt; align-self: flex-start; }
.lst .row .lbl { flex: 0 1 auto; text-align: left; }
.lst .row .dots { flex: 1; border-bottom: 1.2pt dotted #555; margin: 0 4pt 4pt; min-width: 16pt; }
.lst .row .pg { min-width: 18pt; text-align: right; }
table.abbr { border-collapse: collapse; width: 100%; line-height: 1.4; }
table.abbr td { padding: 2pt 6pt 2pt 0; vertical-align: top; }
table.abbr td:first-child { font-weight: bold; width: 32%; }
`;

const doc = (css, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>BTP Thesis - Durgesh Kumar</title><style>${BASE_CSS}${css}</style></head><body>${body}</body></html>`;

/* ---------------------------------------------------------- front matter */

const TITLE = "Cradle: An Open, Source-Cited Calculator for the Embodied Carbon of Indian Building Materials";

function front() {
  const title = `<section class="page title-page">
    <div class="ttl">${TITLE}</div>
    <div class="it">Thesis submitted to the<br>Indian Institute of Technology, Kharagpur<br>In partial fulfillment of the requirements for the award of the degree of</div>
    <div class="b">B.Tech in Civil Engineering</div>
    <div>By<br><span class="b">Durgesh Kumar<br>Roll No.: 23CE36005</span></div>
    <div>Under the guidance of<br><span class="b">Dr. Vihangraj V. Kulkarni</span></div>
    <img class="logo" src="${LOGO}" alt="IIT Kharagpur logo">
    <div class="dept">CIVIL ENGINEERING DEPARTMENT<br>INDIAN INSTITUTE OF TECHNOLOGY KHARAGPUR<br>NOVEMBER 2026</div>
  </section>`;

  const cert = `<section class="page">
    <div class="dept">CIVIL ENGINEERING DEPARTMENT<br>INDIAN INSTITUTE OF TECHNOLOGY KHARAGPUR</div>
    <div class="center" style="margin:16pt 0 18pt"><img class="logo" style="width:2.6cm" src="${LOGO}" alt="IIT Kharagpur logo"></div>
    <div class="fm-head">CERTIFICATE</div>
    <p>This is to certify that we have examined the thesis entitled <b>${TITLE}</b>, submitted by <b>Durgesh Kumar</b> (Roll Number: 23CE36005) an undergraduate student of <b>Department of Civil Engineering</b> in partial fulfillment for the award of degree of B.Tech in Civil Engineering. We hereby accord our approval of it as a study carried out and presented in a manner required for its acceptance in partial fulfillment for the Under Graduate Degree for which it has been submitted. The thesis has fulfilled all the requirements as per the regulations of the Institute and has reached the standard needed for submission.</p>
    <div class="sign" style="margin-top:70pt">
      <div><b>Date:</b> <b>November, 2026</b><br><b>Place:</b> <b>IIT Kharagpur</b></div>
      <div class="sig-right"><b>Dr. Vihangraj V. Kulkarni<br>Department of Civil Engineering<br>IIT Kharagpur</b></div>
    </div>
  </section>`;

  const ack = `<section class="page">
    <div class="fm-head">ACKNOWLEDGEMENTS</div>
    <p>I would like to express my sincere gratitude to my supervisor, Dr. Vihangraj V. Kulkarni, Department of Civil Engineering, IIT Kharagpur, for giving me the opportunity to work on this project and for the guidance, feedback and encouragement throughout it. This guidance shaped the direction of the work and helped me keep it focused on a problem that matters for Indian construction.</p>
    <p>I am also grateful to Dr. Unnikrishna Menon, Postdoctoral Researcher, IIT Kharagpur, for the support and guidance on life cycle assessment. The discussions on LCA helped me understand the topic and build the calculator on a sound method.</p>
    <p>I thank the Department of Civil Engineering, IIT Kharagpur, for the opportunity to carry out this project, and my friends and classmates for their suggestions and feedback. Finally, I thank my parents and family for their constant support and encouragement.</p>
    <div class="ack-sign">Durgesh Kumar<br>23CE36005</div>
  </section>`;

  const abstract = `<section class="page">
    <div class="fm-head">ABSTRACT</div>
    <p>Embodied carbon is the greenhouse gas released while making, transporting and installing building materials. In India it is usually calculated by hand in spreadsheets, often with foreign or undocumented emission factors, so published results are hard to check or repeat.</p>
    <p>This project builds <b>Cradle</b>, a free web calculator for the embodied carbon (global warming potential, GWP) of Indian building materials. It follows ISO 14040/14044 and the life-cycle modules of EN 15804: product (A1–A3), transport to site (A4), construction (A5), end of life (C1–C4) and benefits beyond the life cycle (D). It uses only free, publicly available data: ${LIB_TOTAL} factors for Indian products, 54 of them from Indian Environmental Product Declarations (EPDs), each cited to the table or page it was read from. Material quantities for common work items come from the CPWD Analysis of Rates 2014.</p>
    <p>The calculator was checked in two ways. Forty-nine automated tests check the arithmetic, the unit conversions and the data. It also reproduced a published Indian building study (Chaudhary and Akhtar, 2023): the product stage (A1–A3) matched exactly at 899,412.37 kg ${CO2e}, and construction (A5) to within 0.41 kg. A first application compares 1 m³ of masonry: clay brick gives ${f0(WALLS[0].total)} kg ${CO2e}, fly ash–lime brick ${f0(WALLS[1].total)} and AAC block ${f0(WALLS[2].total)}. Changing only the brick-kiln factor moves the clay-brick result from ${f0(KILNS[0].wall)} to ${f0(KILNS[4].wall)} kg ${CO2e}/m³, which shows why every factor must be reported with its source. Future work includes more validation cases, a comparison of walls that do the same job, and wider uncertainty ranges.</p>
    <p><b>Keywords:</b> embodied carbon, life cycle assessment, global warming potential, EN 15804, Indian construction materials, EPD, CPWD, open data</p>
  </section>`;

  const pg = (e) => (e.page == null ? "" : e.page);
  const contents = `<section class="page toc">
    <div class="fm-head">CONTENTS</div>
    ${toc.map((e) => `<div class="row l${e.lvl}"><span class="lbl">${e.num ? `<span class="num">${e.num}</span>` : ""}${e.title}</span><span class="dots"></span><span class="pg">${pg(e)}</span></div>`).join("")}
  </section>`;
  const list = (head, items, word) => `<section class="page lst">
    <div class="fm-head">${head}</div>
    ${items.map((e) => `<div class="row"><span class="num">${word} ${e.num}</span><span class="lbl">${e.title}</span><span class="dots"></span><span class="pg">${pg(e)}</span></div>`).join("")}
  </section>`;
  const abbr = [
    ["AAC", "Autoclaved aerated concrete"],
    ["A1–A3, A4, A5, C1–C4, D", "EN 15804 life-cycle modules (Figure @fig:modules)"],
    ["BoQ", "Bill of quantities"],
    ["CEA", "Central Electricity Authority"],
    [`${CO2}e`, `Carbon dioxide equivalent`],
    ["CPWD", "Central Public Works Department"],
    ["DAR", "Delhi Analysis of Rates (CPWD)"],
    ["EF", "Emission factor"],
    ["EPD", "Environmental Product Declaration"],
    ["FaL-G", "Fly ash–lime–gypsum (brick)"],
    ["GWP", `Global warming potential, in kg ${CO2e}`],
    ["ICMD", "IFC India Construction Materials Database"],
    ["IFC", "International Finance Corporation"],
    ["LCA", "Life cycle assessment"],
    ["OPC / PPC / PSC", "Ordinary Portland / Portland pozzolana / Portland slag cement"],
  ];
  const abbrPage = `<section class="page"><div class="fm-head">ABBREVIATIONS</div><table class="abbr">${abbr.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("")}</table></section>`;
  return title + cert + ack + abstract + contents + list("LIST OF FIGURES", lof, "Figure") + list("LIST OF TABLES", lot, "Table") + abbrPage;
}

/* ---------------------------------------------------------- build */

const resolve = (html) =>
  html.replace(/@(fig|tab|eq|sec):([a-z0-9-]+)/g, (m, kind, key) => {
    const v = labels[`${kind}:${key}`];
    if (!v) throw new Error(`Unresolved reference ${m}`);
    return v;
  });
for (const list of [toc, lof, lot]) for (const e of list) { e.title = resolve(e.title); e.find = resolve(e.find); }

function print(html, name) {
  const htmlPath = path.join(TMP, `${name}.html`);
  const pdfPath = path.join(TMP, `${name}.pdf`);
  fs.writeFileSync(htmlPath, html);
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--user-data-dir=${path.join(TMP, "profile")}`, `--print-to-pdf=${pdfPath}`, "--virtual-time-budget=3000", pathToFileURL(htmlPath).href], { stdio: "ignore" });
  if (!fs.existsSync(pdfPath)) throw new Error(`Chrome did not write ${pdfPath}`);
  return pdfPath;
}

const norm = (s) => strip(s).replace(/₂/g, "2").replace(/²/g, "2").replace(/³/g, "3").toLowerCase().replace(/[^a-z0-9]/g, "");
function locate(entries, pages) {
  let from = 0;
  for (const e of entries) {
    const key = norm(e.find).slice(0, 60);
    const i = pages.findIndex((t, n) => n >= from && t.includes(key));
    if (i < 0) throw new Error(`Could not find "${e.find}" in the body PDF`);
    e.page = i + 1;
    from = i;
  }
}

const bodyPdf = print(resolve(doc(BODY_CSS, parts.join("\n"))), "body");
const pages = execFileSync("pdftotext", ["-enc", "UTF-8", "-layout", bodyPdf, "-"], { encoding: "utf8", maxBuffer: 1 << 26 }).split("\f").map(norm);
locate(toc, pages);
locate(lof, pages);
locate(lot, pages);
const frontPdf = print(resolve(doc(FRONT_CSS, front())), "front");
execFileSync("pdfunite", [frontPdf, bodyPdf, OUT]);
console.log(`Wrote ${OUT}`);
console.log(`Body pages: ${pages.length - 1}; figures: ${lof.length}; tables: ${lot.length}; work files: ${TMP}`);
