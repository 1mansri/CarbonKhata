/** What the scale weighs. Shared by the server card and the client loop. */
export interface ScaleSample {
  /** Short name for the readout. */
  name: string;
  /** Spoken description. */
  spoken: string;
  /** Cradle-to-gate kg CO₂e for 1 m³ of this wall, from the engine. */
  kg: number;
}

export const readoutOf = (sample: ScaleSample, kg: number) => `${sample.name} · ${Math.round(kg)} kg CO₂e`;
export const spokenOf = (sample: ScaleSample) => `${sample.spoken}: ${Math.round(sample.kg)} kg CO₂e`;
