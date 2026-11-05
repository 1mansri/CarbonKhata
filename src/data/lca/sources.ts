/**
 * Bibliography for every factor in the library. Each factor points here by
 * `sourceId`; the report and the BibTeX export are generated from this
 * list, so a citation is written exactly once.
 *
 * Accessed dates are when the values were extracted and checked against the
 * source document.
 */

export interface Source {
  id: string;
  /** In-text citation, e.g. "CEA (2026)". */
  short: string;
  /** Full reference (APA-like). */
  citation: string;
  url: string;
  license: string;
  accessed: string;
  bibtex: { type: "techreport" | "misc" | "article" | "manual"; fields: Record<string, string> };
}

import { INDIA_SOURCES } from "@/data/lca/india-materials";

const ACCESSED = "2026-11-05";

const list: Source[] = [
  {
    id: "cea-v22",
    short: "CEA (2026)",
    citation:
      "Central Electricity Authority (2026). CO2 Baseline Database for the Indian Power Sector, Version 22.0 — User Guide and database workbook. Ministry of Power, Government of India.",
    url: "https://cea.nic.in/api/cdm-report-version/view-pdf/en/82",
    license:
      "© CEA. Free reproduction with attribution; CEA's copyright policy asks for prior permission by email.",
    accessed: ACCESSED,
    bibtex: {
      type: "techreport",
      fields: {
        author: "{Central Electricity Authority}",
        title: "{CO2} Baseline Database for the Indian Power Sector, Version 22.0",
        institution: "Ministry of Power, Government of India",
        year: "2026",
        month: "aug",
      },
    },
  },
  {
    id: "desnz-2025",
    short: "DESNZ (2025)",
    citation:
      "Department for Energy Security and Net Zero (2025). Greenhouse gas reporting: conversion factors 2025, Version 1. UK Government. GWP basis: IPCC AR5, 100-year.",
    url: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025",
    license: "Open Government Licence v3.0",
    accessed: ACCESSED,
    bibtex: {
      type: "techreport",
      fields: {
        author: "{Department for Energy Security and Net Zero}",
        title: "Greenhouse gas reporting: conversion factors 2025",
        institution: "UK Government",
        year: "2025",
      },
    },
  },
  {
    id: "ighgp-road-2015",
    short: "India GHG Program (2015a)",
    citation:
      "India GHG Program (2015). India Specific Road Transport Emission Factors, Version 1.0 (for stakeholder consultation). WRI India, CII and TERI.",
    url: "https://indiaghgp.org/sites/default/files/Road%20Transport%20Technical%20Paper.pdf",
    license: "© 2015 India GHG Program, all rights reserved. Values cited with attribution.",
    accessed: ACCESSED,
    bibtex: {
      type: "techreport",
      fields: {
        author: "{India GHG Program}",
        title: "India Specific Road Transport Emission Factors, Version 1.0",
        institution: "WRI India, CII and TERI",
        year: "2015",
      },
    },
  },
  {
    id: "ighgp-rail-2015",
    short: "India GHG Program (2015b)",
    citation:
      "India GHG Program (2015). India Specific Rail Transport Emission Factors for Passenger Travel and Material Transport, Version 1.0 (for stakeholder consultation). WRI India, CII and TERI.",
    url: "https://indiaghgp.org/sites/default/files/Rail%20Transport%20Emission.pdf",
    license: "© 2015 India GHG Program, all rights reserved. Values cited with attribution.",
    accessed: ACCESSED,
    bibtex: {
      type: "techreport",
      fields: {
        author: "{India GHG Program}",
        title: "India Specific Rail Transport Emission Factors for Passenger Travel and Material Transport, Version 1.0",
        institution: "WRI India, CII and TERI",
        year: "2015",
      },
    },
  },
  {
    id: "mos-steel-2024",
    short: "Ministry of Steel (2024)",
    citation:
      "Ministry of Steel (2024). Greening the Steel Sector in India: Roadmap and Action Plan. Government of India.",
    url: "https://steel.gov.in/sites/default/files/2025-03/GSI%20Report.pdf",
    license: "© Ministry of Steel, Government of India. Values cited with attribution.",
    accessed: ACCESSED,
    bibtex: {
      type: "techreport",
      fields: {
        author: "{Ministry of Steel}",
        title: "Greening the Steel Sector in India: Roadmap and Action Plan",
        institution: "Government of India",
        year: "2024",
        month: "sep",
      },
    },
  },
  {
    id: "climate-trace",
    short: "Climate TRACE (2025)",
    citation:
      "Climate TRACE (2025). Asset-level emissions inventory, API v6, India. Climate TRACE coalition.",
    url: "https://climatetrace.org",
    license: "CC BY 4.0",
    accessed: ACCESSED,
    bibtex: {
      type: "misc",
      fields: {
        author: "{Climate TRACE}",
        title: "Asset-level emissions inventory ({API} v6)",
        howpublished: "\\url{https://climatetrace.org}",
        year: "2025",
      },
    },
  },
  {
    id: "chaudhary-2022",
    short: "Chaudhary & Akhtar (2023)",
    citation:
      "Chaudhary, A., & Akhtar, A. (2023). Template for Evaluating Cradle-to-Site Environmental Life Cycle Impacts of Buildings in India. ACS Environmental Au, 3(2), 94–104. doi:10.1021/acsenvironau.2c00035. Supporting Information, Tables S3–S6.",
    url: "https://doi.org/10.1021/acsenvironau.2c00035",
    license: "Open access, CC BY-NC-ND 4.0. Quantities and factors cited as facts for validation; the SI file is not redistributed.",
    accessed: ACCESSED,
    bibtex: {
      type: "article",
      fields: {
        author: "Chaudhary, A. and Akhtar, A.",
        title: "Template for Evaluating Cradle-to-Site Environmental Life Cycle Impacts of Buildings in India",
        journal: "ACS Environmental Au",
        volume: "3",
        number: "2",
        pages: "94--104",
        year: "2023",
        doi: "10.1021/acsenvironau.2c00035",
      },
    },
  },
  {
    id: "user",
    short: "User-supplied",
    citation: "Factor supplied by the researcher; see the note on the inventory line for its source.",
    url: "",
    license: "—",
    accessed: ACCESSED,
    bibtex: { type: "misc", fields: { title: "User-supplied factor", year: "" } },
  },
];

const all: Source[] = [...list, ...INDIA_SOURCES.map((s) => ({ ...s, accessed: ACCESSED }))];

export const SOURCES: Record<string, Source> = Object.fromEntries(all.map((s) => [s.id, s]));

export function getSource(id: string): Source | undefined {
  return SOURCES[id];
}
