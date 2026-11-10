# Cradle

An open embodied-carbon calculator for Indian construction research (BTP project).
The name comes from the life-cycle boundary every assessment starts from:
cradle-to-gate (A1–A3), cradle-to-grave (A–C), and benefits beyond (D).

It replaces the Excel sheet a research scholar builds by hand: enter a bill of
materials, get cradle-to-gate (and optionally cradle-to-grave) GWP following
ISO 14040/14044 and the EN 15804+A2 module structure. Every number comes from a
named Indian source with its table or page, and every result shows its working.

## What it does

- **Ledger.** Add materials from a curated India library (or your own cited
  factor), with transport (A4), site wastage and energy (A5), and end of life
  (C1–C4). A running balance column totals the ledger line by line.
- **Results.** Totals by module, hotspots, a data-provenance split ("how much of
  this number rests on Indian data?"), and Monte Carlo uncertainty from each
  factor's published range (5,000 runs, seed 42, reproducible).
- **Compare.** Alternatives on one scale, e.g. OPC vs PPC vs slag-rich concrete.
- **Report and export.** An ISO 14044-structured report (print to PDF),
  an Excel workbook with live formulas, BibTeX references and a project file.
- **BoQ import.** Drop a CPWD-style bill of quantities (cum, sqm, MT, qtl,
  bags, nos); rows are matched to library materials for review.
- **No login.** Projects live in the browser and move as project files.

## Data

Only open or publicly available sources; no ecoinvent, GaBi, ICE or paid APIs.

| Source | What | Notes |
|---|---|---|
| Indian manufacturer EPDs (International EPD System) | Cement (OPC/PPC/PSC/PCC), ready-mix concrete, TMT rebar and sections, GGBS, fly ash, glass, plasterboard, aluminium, paint | Cited with registration number and validity date |
| IFC (2017) India Construction Materials Database | Bricks by kiln type, blocks, aggregates, sand, tiles, generic cement and steel | © IFC, values cited with attribution |
| Ministry of Steel (2024) roadmap | Crude steel CO₂ intensity by route, with ranges | Table 1.7 |
| CEA CO₂ Baseline Database v22.0 | India grid factor (FY2025-26: 0.6751 kg CO₂/kWh) | CEA asks for permission by email before public reuse |
| Maithel et al. (2012) | Brick kiln stack CO₂ (firing stage only) | |
| India GHG Program (2015) | Indian truck (per vehicle-km) and rail freight factors | Draft for consultation, all rights reserved |
| UK DESNZ (2025) | Freight, diesel, water and end-of-life proxies | Open Government Licence v3.0 |
| Climate TRACE (live) | Indian cement, steel, aluminium and power plants | CC BY 4.0; live "Library" tab |
| Ember (live) | India grid carbon intensity and generation mix | Needs a free `EMBER_API_KEY` |

The library is generated from a verified extraction in which every value was
read from its source PDF or spreadsheet; see `src/data/lca/`.

## Stack and layout

Next.js (App Router) + TypeScript, Tailwind CSS, Base UI, Prisma 7 + SQLite
(live data only), Fuse.js, SheetJS.

- `src/lib/lca/` — the engine: pure TypeScript, no React. `calculate.ts`
  (linear, with a working string per module), `units.ts`, `uncertainty.ts`,
  `provenance.ts`, `export.ts`, `boq.ts`.
- `src/data/lca/` — the factor library and bibliography, versioned in git.
- `src/components/` — `project/` (workspace), `charts/` (hand-built SVG/HTML
  charts), `home/`, `library/`, `import/`.
- `src/lib/sources/`, `src/lib/repositories/` — live Climate TRACE / Ember sync.

## Getting started

```bash
pnpm install
cp .env.example .env
pnpm prisma db seed    # live Climate TRACE + Ember data for the Library tab
pnpm dev
```

## Validation

The engine reproduces a published Indian building study, Chaudhary & Akhtar
(2023), *ACS Environmental Au* 3(2):94–104: 78 materials from a CPWD bill of
quantities, rebuilt with the paper's own factors and units (per 1000 bricks,
quintals, packs of 10/100, litres, metres).

| Stage | Published (kg CO₂e) | Cradle |
|---|---|---|
| A1–A3 material production | 899,412.37 | 899,412.37 (every line matches Table S4) |
| A5 on-site construction | 12,075.01 | 12,074.60 (0.41 kg of welding is entered per cm, which the tool can't express) |

A4 transport (24.6 t) is not part of the check: the paper rounds truck trips per
material category, while the tool allocates trips in proportion to mass. The
case also ships as a worked example on the home page. See
`src/data/lca/validation.ts`.

## Tests

```bash
pnpm test
```

Covers the engine, unit conversion, uncertainty, the BoQ parser (including
CPWD-style headers and units), the integrity of every library factor (source
exists, locator present, ranges bracket the value), the Excel export (every
formula recomputes to the engine's value) and the validation case above.

## Research

`docs/research/literature-review.md` reviews 20 Indian embodied-carbon studies,
the pain points of current practice (data gaps, 6× spread in brick factors,
irreproducible papers, no uncertainty reporting), Indian policy for 2023–2026
(CCTS, Green Steel Taxonomy, ECSBC, CBAM) and the validation candidates.
`data/extracted/` holds the verified factor extractions behind the library.
