import {
  corners,
  cylinder,
  depthOf,
  haloOf,
  insetPlan,
  knurl,
  lineOnTop,
  pathOf,
  planOutline,
  ring,
  segment,
  sideMatrix,
  sideSeam,
  slabOf,
  type Flat,
  type Plan,
  type Plane,
  type SolidPaths,
} from "@/components/iso/iso-kit";
import {
  BEZEL_T,
  BODY,
  BODY_H,
  DIAL_R,
  DIAL_Y,
  DIAL_Z,
  FACE_X,
  FOOT_H,
  FRONT_X,
  PAN,
  PAN_H,
  PAN_TOP,
  PAN_Z,
  P,
  PLATE_T,
  PLINTH,
  PLINTH_H,
  POST,
  SIDE_Y,
  SWEEP,
  at,
  onFace,
} from "./view";

/*
 * Every static part of the carbon scale, computed once (on the server).
 * Recipes follow the anatomy kit's parts vocabulary: base plate on feet,
 * dial gauge, knurled knob, label plate. Heights in world units, z up.
 */

const solid = (plan: Plan, z: number, h: number, steps = 6, bevel = 0) => slabOf(plan, z, h, P, steps, bevel);
const cyl = (cx: number, cy: number, r: number, z: number, h: number, steps = 32, bevel = 0) => cylinder(cx, cy, r, z, h, P, steps, bevel);
const join = (paths: string[]) => paths.filter(Boolean).join("");
const byDepth = (points: Plane[]) => [...points].sort((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));
const RAD = Math.PI / 180;

function hull(points: Flat[]): Flat[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: Flat[]) => {
    const out: Flat[] = [];
    for (const point of list) {
      while (out.length >= 2 && cross(out[out.length - 2]!, out[out.length - 1]!, point) <= 0) out.pop();
      out.push(point);
    }
    return out;
  };
  const lower = half(sorted);
  const upper = half([...sorted].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/**
 * A disc whose axis runs along +x (toward the viewer's right-front): the
 * dial bezel and its hub. The front face is the lighter "top"; the rim
 * band shows as one shade. Same path roles as the kit's solids.
 */
function discX(x0: number, cy: number, cz: number, r: number, t: number, steps = 64): SolidPaths {
  const back: Flat[] = [];
  const front: Flat[] = [];
  for (let step = 0; step < steps; step++) {
    const a = (step / steps) * Math.PI * 2;
    back.push(at([x0, cy + r * Math.cos(a), cz + r * Math.sin(a)]));
    front.push(at([x0 + t, cy + r * Math.cos(a), cz + r * Math.sin(a)]));
  }
  const outline = pathOf(hull([...back, ...front]), true);
  return { fill: outline, outline, crease: pathOf(front, true), top: pathOf(front, true), shades: ["", outline, "", ""] };
}

/** A circle drawn on the dial face. */
const faceCircle = (r: number, steps = 72) =>
  pathOf(
    Array.from({ length: steps }, (_, step) => {
      const a = (step / steps) * Math.PI * 2;
      return onFace(r * Math.sin(a), r * Math.cos(a));
    }),
    true,
  );

/** A closed slot (rounded ends) in the +y face of the housing. */
function ventSlot(xc: number, z0: number, z1: number, w: number) {
  const r = w / 2;
  const y = SIDE_Y + 0.05;
  const points: Flat[] = [];
  for (let step = 0; step <= 8; step++) {
    const a = Math.PI + (step / 8) * Math.PI;
    points.push(at([xc + r * Math.cos(a), y, z1 - r - r * Math.sin(a)]));
  }
  for (let step = 0; step <= 8; step++) {
    const a = (step / 8) * Math.PI;
    points.push(at([xc + r * Math.cos(a), y, z0 + r - r * Math.sin(a)]));
  }
  return pathOf(points, true);
}

// ── Base: plinth on four feet, with a zero knob and a spirit level on the front ledge ──

const FEET = byDepth(corners(PLINTH, 18));
const PLINTH_SCREWS = corners(PLINTH, 7);
const KNOB: Plane = [56, -40];
const LEVEL: Plane = [56, 40];

export const BASE_ART = {
  halo: haloOf(PLINTH, -PLINTH_H - FOOT_H, PLINTH_H, P),
  feet: FEET.map(([x, y]) => [cyl(x, y, 7, -PLINTH_H - FOOT_H, 1.6, 28), cyl(x, y, 5.4, -PLINTH_H - FOOT_H + 1.6, FOOT_H - 1.6, 28)]),
  slab: solid(PLINTH, -PLINTH_H, PLINTH_H, 8, 1.4),
  groove: planOutline(insetPlan(PLINTH, 4.5), 0, P),
  screwRings: join(PLINTH_SCREWS.map(([x, y]) => ring(x, y, 2.1, 0, P, 16))),
  screws: PLINTH_SCREWS.map(([x, y]) => at([x, y, 0])),
  knobCollar: cyl(KNOB[0], KNOB[1], 4.6, 0, 1.2, 28),
  knob: cyl(KNOB[0], KNOB[1], 3.4, 1.2, 4.6, 28),
  knobKnurl: knurl(KNOB[0], KNOB[1], 3.4, 1.2, 5.8, 28, P),
  knobPointer: lineOnTop([KNOB[0], KNOB[1]], [KNOB[0] + 3.4, KNOB[1]], 5.8, P),
  knobCentre: [at([KNOB[0], KNOB[1], 5.8])],
  level: cyl(LEVEL[0], LEVEL[1], 4.2, 0, 1.8, 32),
  levelRing: ring(LEVEL[0], LEVEL[1], 2.6, 1.8, P, 28),
  levelBubble: [at([LEVEL[0] + 0.4, LEVEL[1] - 0.3, 1.8])],
};

// ── Housing: seams, vents and a label plate on the +y side ──

const LABEL_PLATE: Plan = { x: 6, y: SIDE_Y, w: 30, d: 1, r: 0.4 };
const LABEL_FACE = SIDE_Y + 1.05;

export const BODY_ART = {
  halo: haloOf(insetPlan(BODY, 4), 0, 0.1, P),
  slab: solid(BODY, 0, BODY_H, 8, 1.4),
  seams: join([6, BODY_H - 6].map((z) => sideSeam(BODY, z, P, 8))),
  vents: join([-40, -33, -26, -19, -12].map((x) => ventSlot(x, 14, 40, 3.2))),
  label: solid(LABEL_PLATE, 16, 12, 2),
  labelRules: join(
    [
      [25, 26],
      [22.5, 18],
      [20, 22],
    ].map(([z, length]) => segment([LABEL_PLATE.x + 4, LABEL_FACE, z], [LABEL_PLATE.x + 4 + length, LABEL_FACE, z], P)),
  ),
  labelScrews: [at([LABEL_PLATE.x + 1.8, LABEL_FACE, 22]), at([LABEL_PLATE.x + LABEL_PLATE.w - 1.8, LABEL_FACE, 22])],
  topHalo: haloOf(insetPlan(PAN, 8), BODY_H, 0.1, P),
  postCollar: cyl(POST[0], POST[1], 7, BODY_H, 1.6, 32),
  post: cyl(POST[0], POST[1], 3.6, BODY_H + 1.6, PAN_Z - BODY_H - 1.6, 24),
};

// ── Dial: plate, bezel, face, ticks, label, hub ──

const PLATE_X = FRONT_X + PLATE_T + 0.02;

function dialTicks() {
  const minor: string[] = [];
  const major: string[] = [];
  const outer = DIAL_R - 3.2;
  for (let index = 0; index <= 80; index++) {
    if (index === 0) continue;
    const a = (-SWEEP / 2 + (index * SWEEP) / 80) * RAD;
    const big = index % 10 === 0;
    const inner = outer - (big ? 3.2 : 1.6);
    (big ? major : minor).push(pathOf([onFace(Math.sin(a) * inner, Math.cos(a) * inner), onFace(Math.sin(a) * outer, Math.cos(a) * outer)]));
  }
  return { minor: join(minor), major: join(major) };
}

const TICKS = dialTicks();
const ZERO = (-SWEEP / 2) * RAD;

export const DIAL_ART = {
  plate: solid({ x: FRONT_X, y: DIAL_Y - 27, w: PLATE_T, d: 54, r: 0.6 }, 2, 54, 2, 0.4),
  plateScrews: [
    [DIAL_Y - 23.5, 5.5],
    [DIAL_Y + 23.5, 5.5],
    [DIAL_Y - 23.5, 52.5],
    [DIAL_Y + 23.5, 52.5],
  ].map(([y, z]) => at([PLATE_X, y, z])),
  bezel: discX(FRONT_X + PLATE_T, DIAL_Y, DIAL_Z, DIAL_R, BEZEL_T, 80),
  bezelRing: faceCircle(DIAL_R - 1.4),
  faceRing: faceCircle(DIAL_R - 2.6),
  minor: TICKS.minor,
  major: TICKS.major,
  zero: pathOf([
    onFace(Math.sin(ZERO) * (DIAL_R - 7), Math.cos(ZERO) * (DIAL_R - 7)),
    onFace(Math.sin(ZERO) * (DIAL_R - 3.2), Math.cos(ZERO) * (DIAL_R - 3.2)),
  ]),
  label: sideMatrix([FACE_X, DIAL_Y], DIAL_Z - 11, P, "right"),
  hub: discX(FACE_X, DIAL_Y, DIAL_Z, 2.3, 1.1, 28),
  pin: [onFace(0, 0, FACE_X + 1.15)],
};

// ── Pan: the part that sinks under the load ──

const PAN_INSET = insetPlan(PAN, 4);

export const PAN_ART = {
  slab: solid(PAN, PAN_Z, PAN_H, 8, 0.8),
  groove: planOutline(PAN_INSET, PAN_TOP, P),
  // Ribs run straight edge to edge of the groove, clear of its rounded corners.
  ribs: join(
    Array.from({ length: 9 }, (_, index) => -32 + index * 8).map((y) =>
      lineOnTop([PAN_INSET.x, y], [PAN_INSET.x + PAN_INSET.w, y], PAN_TOP, P),
    ),
  ),
  screws: corners(PAN, 2.2).map(([x, y]) => at([x, y, PAN_TOP])),
};

// ── Samples: what goes on the pan. Real proportions, 1 unit ≈ 4 mm. ──

export interface SampleArt {
  halo: string;
  /** Painter's order: far before near, bottom before top. */
  parts: { paths: SolidPaths; tone: "hi" | "mid" | "lo" }[];
  /** Engraved detail drawn over the parts. */
  lines: string;
  faint: string;
}

const CX = POST[0];

/** Two courses of two bricks with a mortar bed: L × W × H in mm. */
function brickStack(lengthMm: number, widthMm: number, heightMm: number, bevel: number, frog: boolean): SampleArt {
  const l = lengthMm / 4;
  const w = widthMm / 4;
  const h = heightMm / 4;
  const bed = 1.2;
  const ys = [-w - 1, 1];
  const brick = (y: number): Plan => ({ x: CX - l / 2, y, w: l, d: w, r: 0.8 });
  const top = PAN_TOP + h + bed + h;
  const mortar: Plan = { x: CX - l / 2 + 0.5, y: -w - 0.5, w: l - 1, d: w * 2 + 1, r: 0.6 };
  return {
    halo: haloOf(insetPlan({ x: CX - l / 2, y: -w - 1, w: l, d: w * 2 + 2, r: 1 }, 2), PAN_TOP, 0.1, P),
    parts: [
      ...ys.map((y) => ({ paths: solid(brick(y), PAN_TOP, h, 4, bevel), tone: "hi" as const })),
      { paths: solid(mortar, PAN_TOP + h, bed, 4), tone: "lo" as const },
      ...ys.map((y) => ({ paths: solid(brick(y), PAN_TOP + h + bed, h, 4, bevel), tone: "hi" as const })),
    ],
    // A clay brick's frog: the hollow pressed into its top.
    lines: frog ? join(ys.map((y) => planOutline({ ...insetPlan(brick(y), 6), r: 2.4 }, top, P, 6))) : "",
    faint: frog ? join(ys.map((y) => planOutline({ ...insetPlan(brick(y), 7.4), r: 1.6 }, top, P, 6))) : "",
  };
}

function aacBlock(): SampleArt {
  const block: Plan = { x: CX - 300 / 8, y: -200 / 8, w: 300 / 4, d: 200 / 4, r: 0.6 };
  const h = 200 / 4;
  return {
    halo: haloOf(insetPlan(block, 2), PAN_TOP, 0.1, P),
    parts: [{ paths: solid(block, PAN_TOP, h, 4, 0.5), tone: "hi" }],
    lines: "",
    faint: planOutline(insetPlan(block, 2.4), PAN_TOP + h, P, 4),
  };
}

/** Clay brick 230 × 110 × 70 mm (IS 1077), FaL-G brick 230 × 110 × 75 mm (IS 12894), AAC block cut to 300 × 200 × 200 mm. */
export const SAMPLE_ART: SampleArt[] = [brickStack(230, 110, 70, 0.6, true), brickStack(230, 110, 75, 1, false), aacBlock()];
