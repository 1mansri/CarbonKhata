import { fitProjection, iso, type Flat, type Plan, type Point3 } from "@/components/iso/iso-kit";

/**
 * World layout of the carbon scale, in units of about 4 mm, z up. The
 * scale faces +x (its dial) and +y (its side with the vents); the camera
 * looks from that corner.
 */
export const WIDTH = 600;
export const HEIGHT = 440;
export const AZIMUTH = 30;

/** Cast plinth on four feet. */
export const PLINTH: Plan = { x: -62, y: -56, w: 128, d: 112, r: 9 };
export const PLINTH_H = 8;
export const FOOT_H = 5;

/** The housing; its +x face carries the dial. */
export const BODY: Plan = { x: -52, y: -46, w: 96, d: 92, r: 10 };
export const BODY_H = 58;
export const FRONT_X = BODY.x + BODY.w; // 44
export const SIDE_Y = BODY.y + BODY.d; // 46

/** Dial on the front face: a mounting plate, then a bezel disc. */
export const PLATE_T = 1.6;
export const DIAL_Y = 0;
export const DIAL_Z = 29;
export const DIAL_R = 22;
export const BEZEL_T = 3.2;
export const FACE_X = FRONT_X + PLATE_T + BEZEL_T + 0.05;
/** 0 to 800 kg CO₂e over a 300° sweep, gap at the bottom for the label. */
export const DIAL_MAX = 800;
export const SWEEP = 300;

/** Pan on a post. */
export const POST: [number, number] = [-4, 0];
export const PAN: Plan = { x: -50, y: -44, w: 92, d: 88, r: 7 };
export const PAN_Z = BODY_H + 6;
export const PAN_H = 3.4;
export const PAN_TOP = PAN_Z + PAN_H;
/** How far the pan sinks at full scale (a real platform moves a few mm). */
export const PAN_TRAVEL = 2.4;

/** A sample is lowered from this height and lifted back to it. */
export const LIFT = 14;

const corners = ({ x, y, w, d }: Plan, z0: number, z1: number): Point3[] => {
  const out: Point3[] = [];
  for (const px of [x, x + w]) for (const py of [y, y + d]) for (const z of [z0, z1]) out.push([px, py, z]);
  return out;
};

export const P = fitProjection(
  [
    ...corners(PLINTH, -PLINTH_H - FOOT_H, 0),
    ...corners(PAN, PAN_Z, PAN_TOP + 50),
    [FACE_X, DIAL_Y - DIAL_R, DIAL_Z - DIAL_R],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: AZIMUTH },
);

export const at = (point: Point3): Flat => iso(point, P);

/**
 * A point on the dial face: u to the reader's right, v up, from the
 * dial centre. Facing +x, the reader's right is −y.
 */
export const onFace = (u: number, v: number, x = FACE_X): Flat => at([x, DIAL_Y - u, DIAL_Z + v]);

/** Needle angle in radians, clockwise from 12 o'clock. */
export const angleOf = (kg: number) => ((-SWEEP / 2 + (SWEEP * Math.min(Math.max(kg, 0), DIAL_MAX)) / DIAL_MAX) * Math.PI) / 180;
