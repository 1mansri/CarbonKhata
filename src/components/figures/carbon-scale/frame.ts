import { pathOf, translateAlong } from "@/components/iso/iso-kit";
import { DIAL_MAX, DIAL_R, P, PAN_TRAVEL, angleOf, onFace } from "./view";

/** The needle at a reading: a short tail past the hub, the tip just inside the ticks. */
export function needleAt(kg: number) {
  const a = angleOf(kg);
  const s = Math.sin(a);
  const c = Math.cos(a);
  return pathOf([onFace(-s * 4.2, -c * 4.2), onFace(s * (DIAL_R - 4.4), c * (DIAL_R - 4.4))]);
}

/** The pan sinks in proportion to the load on it. */
export const panAt = (kg: number) => translateAlong(P, [0, 0, -(Math.max(0, kg) / DIAL_MAX) * PAN_TRAVEL]);

/** A sample held `lift` units above the pan. */
export const liftAt = (lift: number) => translateAlong(P, [0, 0, lift]);
