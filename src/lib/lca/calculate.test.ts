import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateItem, calculateProject } from "@/lib/lca/calculate";
import { compatibleUnits, toDeclaredUnit, toKg } from "@/lib/lca/units";
import { mulberry32, runMonteCarlo, triangular } from "@/lib/lca/uncertainty";
import type {
  EolFactor,
  InventoryItem,
  MaterialFactor,
  Project,
  TransportFactor,
} from "@/lib/lca/types";

const provenance = {
  indicator: "GWP-total",
  geography: "IN",
  year: 2024,
  quality: "user",
  source: { sourceId: "test" },
} as const;

const concrete: MaterialFactor = {
  ...provenance,
  id: "concrete",
  name: "Concrete",
  category: "Concrete",
  declaredUnit: "m3",
  gwp: 300,
  low: 250,
  high: 400,
  massPerUnitKg: 2400,
  eolGroup: "concrete",
};

const rebar: MaterialFactor = {
  ...provenance,
  id: "rebar",
  name: "Rebar",
  category: "Steel",
  declaredUnit: "t",
  gwp: 2500,
  epdEndOfLife: { c1c4: 10, d: -900 },
};

const truckTkm: TransportFactor = {
  ...provenance,
  id: "truck",
  name: "Truck",
  basis: "tkm",
  value: 0.1,
  low: 0.08,
  high: 0.12,
};

const truckVkm: TransportFactor = { ...truckTkm, id: "truck-vkm", basis: "vkm", value: 0.75 };

const landfill: EolFactor = {
  ...provenance,
  id: "landfill",
  group: "concrete",
  route: "landfill",
  value: 1.25,
};

const allIn = { a4: true, a5: true, c: true, d: true };
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

function item(overrides: Partial<InventoryItem>): InventoryItem {
  return { id: "i", quantity: 10, unit: "m3", material: concrete, ...overrides };
}

describe("units", () => {
  it("converts volume to mass through density", () => {
    assert.equal(toKg(2, "m3", concrete), 4800);
    assert.equal(toDeclaredUnit(4800, "kg", concrete), 2);
  });

  it("scales within a dimension", () => {
    assert.equal(toDeclaredUnit(500, "kg", rebar), 0.5);
    assert.equal(toKg(1.5, "t", rebar), 1500);
  });

  it("refuses conversions without a unit mass", () => {
    assert.equal(toDeclaredUnit(1, "m3", rebar), null);
    assert.deepEqual(compatibleUnits(rebar), ["kg", "t"]);
    assert.deepEqual(compatibleUnits(concrete), ["kg", "t", "m3", "L"]);
  });
});

describe("calculateItem", () => {
  it("A1–A3 is quantity in declared unit × factor, with visible working", () => {
    const r = calculateItem(item({ quantity: 4800, unit: "kg" }), allIn);
    close(r.modules["A1-A3"], 600);
    assert.match(r.working["A1-A3"]!, /4,800 kg = 2 m³ × 300 kg CO₂e\/m³ = 600 kg CO₂e/);
  });

  it("A4 per tonne-km uses the item mass", () => {
    const r = calculateItem(item({ transport: { distanceKm: 50, factor: truckTkm } }), allIn);
    // 10 m³ × 2.4 t/m³ = 24 t; 24 × 50 × 0.1
    close(r.modules.A4, 120);
  });

  it("A4 per vehicle-km divides by payload and warns without one", () => {
    const ok = calculateItem(
      item({ transport: { distanceKm: 100, factor: truckVkm, payloadT: 12 } }),
      allIn,
    );
    close(ok.modules.A4, (24 / 12) * 100 * 0.75);

    const missing = calculateItem(item({ transport: { distanceKm: 100, factor: truckVkm } }), allIn);
    assert.equal(missing.modules.A4, 0);
    assert.equal(missing.warnings.length, 1);
  });

  it("A5 wastage applies to A1–A3 + A4", () => {
    const r = calculateItem(
      item({ transport: { distanceKm: 50, factor: truckTkm }, wastagePct: 5 }),
      allIn,
    );
    close(r.modules.A5, 0.05 * (3000 + 120));
  });

  it("C1–C4 from a route factor (per tonne) or the EPD", () => {
    const route = calculateItem(item({ endOfLife: { kind: "route", factor: landfill } }), allIn);
    close(route.modules["C1-C4"], 24 * 1.25);

    const epd = calculateItem(
      { id: "r", quantity: 2, unit: "t", material: rebar, endOfLife: { kind: "epd" } },
      allIn,
    );
    close(epd.modules["C1-C4"], 20);
  });

  it("D is reported but never added to the total", () => {
    const r = calculateItem({ id: "r", quantity: 2, unit: "t", material: rebar }, allIn);
    close(r.modules.D, -1800);
    close(r.total, 5000);
  });

  it("modules outside the boundary are zero", () => {
    const r = calculateItem(
      item({ transport: { distanceKm: 50, factor: truckTkm }, wastagePct: 5 }),
      { a4: false, a5: false, c: false, d: false },
    );
    assert.equal(r.modules.A4, 0);
    assert.equal(r.modules.A5, 0);
    close(r.total, 3000);
  });
});

function project(items: InventoryItem[]): Project {
  return {
    schemaVersion: 1,
    id: "p",
    name: "Test",
    createdAt: "",
    updatedAt: "",
    scope: { goal: "", functionalUnit: "1 m³", boundary: allIn, floorAreaM2: 100 },
    items,
    siteEnergy: [
      {
        id: "e",
        quantity: 1000,
        factor: {
          ...provenance,
          id: "grid",
          name: "Grid",
          unit: "kWh",
          value: 0.7,
        },
      },
    ],
  };
}

describe("calculateProject", () => {
  it("sums items and site energy into modules and normalises by floor area", () => {
    const p = project([
      item({ id: "a" }),
      { id: "b", quantity: 1, unit: "t", material: rebar },
    ]);
    const r = calculateProject(p);
    close(r.modules["A1-A3"], 3000 + 2500);
    close(r.modules.A5, 700);
    close(r.total, 6200);
    close(r.perFloorArea!, 62);
  });
});

describe("uncertainty", () => {
  it("triangular sampling stays inside its bounds and hits the mode", () => {
    assert.equal(triangular(0, 1, 2, 4), 1);
    assert.equal(triangular(1, 1, 2, 4), 4);
    close(triangular(1 / 3, 1, 2, 4), 2);
  });

  it("is reproducible for a seed and brackets the deterministic total", () => {
    const p = project([item({ transport: { distanceKm: 50, factor: truckTkm } })]);
    const a = runMonteCarlo(p, 2000, 7);
    const b = runMonteCarlo(p, 2000, 7);
    assert.deepEqual(a.samples, b.samples);
    const total = calculateProject(p).total;
    assert.ok(a.p2_5 < total && total < a.p97_5);
    // Grid electricity (700) has no range, everything else does.
    close(a.coverage, (total - 700) / total);
  });

  it("PRNG yields values in [0, 1)", () => {
    const rand = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const v = rand();
      assert.ok(v >= 0 && v < 1);
    }
  });
});
