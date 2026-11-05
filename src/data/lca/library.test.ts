import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MATERIALS } from "@/data/lca/materials";
import { TRANSPORT_FACTORS } from "@/data/lca/transport";
import { SITE_FACTORS } from "@/data/lca/site";
import { EOL_FACTORS } from "@/data/lca/end-of-life";
import { SOURCES } from "@/data/lca/sources";

const all = [...MATERIALS, ...TRANSPORT_FACTORS, ...SITE_FACTORS, ...EOL_FACTORS];

describe("factor library integrity", () => {
  it("every factor cites a source that exists, with a locator", () => {
    for (const f of all) {
      assert.ok(SOURCES[f.source.sourceId], `${f.id}: unknown source ${f.source.sourceId}`);
      assert.ok(f.source.locator, `${f.id}: missing table/page locator`);
    }
  });

  it("ids are unique", () => {
    const ids = all.map((f) => f.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("values are positive and ranges bracket the central value", () => {
    for (const m of MATERIALS) {
      assert.ok(m.gwp > 0, `${m.id}: gwp must be positive`);
      if (m.low != null || m.high != null) {
        assert.ok(m.low != null && m.high != null, `${m.id}: range needs both ends`);
        assert.ok(m.low! <= m.gwp && m.gwp <= m.high!, `${m.id}: ${m.low} ≤ ${m.gwp} ≤ ${m.high}`);
      }
    }
    for (const f of [...TRANSPORT_FACTORS, ...SITE_FACTORS, ...EOL_FACTORS]) {
      assert.ok(f.value > 0, `${f.id}: value must be positive`);
    }
  });

  it("factors declared per volume, area or piece carry a unit mass", () => {
    for (const m of MATERIALS) {
      if (!["kg", "t"].includes(m.declaredUnit)) {
        assert.ok(m.massPerUnitKg && m.massPerUnitKg > 0, `${m.id}: needs massPerUnitKg`);
      }
    }
  });

  it("every source has a licence statement and a URL (except user data)", () => {
    for (const s of Object.values(SOURCES)) {
      assert.ok(s.license, `${s.id}: missing licence`);
      if (s.id !== "user") assert.match(s.url, /^https:\/\//, `${s.id}: missing URL`);
    }
  });
});
