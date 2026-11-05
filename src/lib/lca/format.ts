/**
 * Number formatting shared by the engine's working strings, the UI and the
 * exports. Fixed locale so server and client render identically.
 */
const formatters = new Map<number, Intl.NumberFormat>();

/** Rounds to `sig` significant figures, with thousands separators. */
export function fmt(value: number, sig = 4): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  let f = formatters.get(sig);
  if (!f) {
    f = new Intl.NumberFormat("en-US", { maximumSignificantDigits: sig });
    formatters.set(sig, f);
  }
  return f.format(value);
}

/** kg CO2e with an automatic switch to tonnes above 10 t. */
export function fmtCarbon(kg: number): { value: string; unit: string } {
  if (Math.abs(kg) >= 10_000) return { value: fmt(kg / 1000, 3), unit: "t CO₂e" };
  return { value: fmt(kg, 3), unit: "kg CO₂e" };
}

export function fmtPct(share: number): string {
  return `${fmt(share * 100, 3)}%`;
}
