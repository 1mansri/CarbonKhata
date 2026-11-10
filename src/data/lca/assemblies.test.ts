import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ASSEMBLIES, BRICK_KG, assemblyMaterialsExist, expandAssembly, getAssembly } from "@/data/lca/assemblies";
import { getMaterial } from "@/data/lca/materials";
import { TEMPLATES } from "@/data/lca/templates";
import { calculateProject } from "@/lib/lca/calculate";
import { createProject } from "@/lib/lca/project";
import { compatibleUnits, toKg } from "@/lib/lca/units";

const cementT = (id: string) =>
  expandAssembly(getAssembly(id)!, 1)
    .filter((l) => l.materialId === "in-epd-mean-opc")
    .reduce((s, l) => s + l.quantity, 0);

const massKg = (id: string) =>
  expandAssembly(getAssembly(id)!, 1).reduce((s, l) => s + toKg(l.quantity, l.unit, getMaterial(l.materialId)!)!, 0);

describe("CPWD assemblies", () => {
  it("only uses library materials, in units they accept", () => {
    assert.deepEqual(assemblyMaterialsExist(), []);
    for (const a of ASSEMBLIES) {
      for (const l of expandAssembly(a, 1)) {
        assert.ok(compatibleUnits(getMaterial(l.materialId)!).includes(l.unit), `${a.id}: ${l.label} in ${l.unit}`);
      }
    }
  });

  it("matches CPWD's separately published cement coefficients (DSR 2014, pp.407–408)", () => {
    // DSR gives quintals of cement per m³ of work; 1 quintal = 0.1 t.
    assert.ok(Math.abs(cementT("brick-clay-cm16") - 0.0625) < 1e-9, "6.4.2: 0.625 quintal");
    assert.ok(Math.abs(cementT("aac-cm14") - 0.057) < 1e-9, "6.38: 0.57 quintal");
    assert.ok(Math.abs(cementT("concrete-m25-design") - 0.33) < 1e-9, "5.33: 330 kg/m³");
  });

  it("gives a brickwork mass within 10% of IS 875's 1 920 kg/m³ for clay brick masonry", () => {
    const kg = massKg("brick-clay-cm16");
    assert.ok(Math.abs(kg / 1920 - 1) < 0.1, `got ${kg.toFixed(0)} kg/m³`);
  });

  it("uses a non-modular brick of about 3.1 kg", () => {
    assert.ok(BRICK_KG > 3.0 && BRICK_KG < 3.2, String(BRICK_KG));
  });

  it("scales linearly with the amount of work", () => {
    const one = expandAssembly(getAssembly("aac-cm14")!, 1);
    const ten = expandAssembly(getAssembly("aac-cm14")!, 2.5);
    one.forEach((l, i) => assert.ok(Math.abs(ten[i].quantity - l.quantity * 2.5) < 1e-3));
  });
});

describe("templates", () => {
  it("build valid projects with a positive total", () => {
    for (const t of TEMPLATES) {
      const result = calculateProject(createProject(t.build()));
      assert.ok(Number.isFinite(result.total) && result.total > 0, `${t.id}: ${result.total}`);
      assert.deepEqual(result.warnings, [], `${t.id} has warnings`);
    }
  });

  it("offer every assembly as a worked example", () => {
    const sources = TEMPLATES.map((t) => t.basedOn);
    for (const a of ASSEMBLIES) {
      const item = a.source.match(/item ([\d.]+)/)![1];
      assert.ok(sources.some((s) => s.endsWith(`item ${item}`)), `${a.id} has no template`);
    }
  });
});
