import type { DataQuality, ModuleId } from "@/lib/lca/types";

/** How each data-quality tag is named and explained in the UI and report. */
export const QUALITY_META: Record<DataQuality, { label: string; description: string; india: boolean }> = {
  "india-epd": {
    label: "Indian EPD",
    description: "Third-party verified Environmental Product Declaration of a product made in India.",
    india: true,
  },
  "india-official": {
    label: "Govt. of India",
    description: "Published by a Government of India body (CEA, ministries, UNFCCC submissions).",
    india: true,
  },
  "india-literature": {
    label: "Indian study",
    description: "Peer-reviewed paper or technical study of Indian production or transport.",
    india: true,
  },
  "india-live": {
    label: "Live India data",
    description: "Fetched from a live API (Climate TRACE) for Indian facilities.",
    india: true,
  },
  "ipcc-default": {
    label: "IPCC default",
    description: "IPCC default value, not specific to India.",
    india: false,
  },
  "international-proxy": {
    label: "Proxy",
    description: "Non-Indian value used because no open Indian value exists.",
    india: false,
  },
  user: {
    label: "Your data",
    description: "Entered by you — cite its source on the line.",
    india: false,
  },
};

export const MODULE_META: Record<ModuleId, { label: string; name: string; color: string }> = {
  "A1-A3": { label: "A1–A3", name: "Product", color: "var(--module-a13)" },
  A4: { label: "A4", name: "Transport to site", color: "var(--module-a4)" },
  A5: { label: "A5", name: "Construction", color: "var(--module-a5)" },
  "C1-C4": { label: "C1–C4", name: "End of life", color: "var(--module-c)" },
  D: { label: "D", name: "Beyond boundary", color: "var(--module-d)" },
};
