import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDraftRequest, parseDraft, vocabulary } from "@/lib/lca/ai-draft";
import { ASSEMBLIES } from "@/data/lca/assemblies";
import { MATERIALS } from "@/data/lca/materials";

const reply = (fields: Record<string, unknown> = {}) =>
  JSON.stringify({
    inScope: true,
    reason: "",
    projectName: "Brick wall",
    functionalUnit: "10 m² of 230 mm wall",
    assumptions: "",
    assemblies: [],
    others: [],
    ...fields,
  });

describe("AI inventory draft", () => {
  it("lets the model choose only cited assemblies and calculator units", () => {
    const body = buildDraftRequest("brick wall", ASSEMBLIES, MATERIALS, "test-model");
    const props = body.response_format.json_schema.schema.properties;
    assert.deepEqual(props.assemblies.items.properties.assemblyId.enum, ASSEMBLIES.map((a) => a.id));
    assert.equal(body.response_format.json_schema.strict, true);
    assert.ok(body.messages[0].content.includes("brick-clay-cm16"));
  });

  it("keeps brand EPDs out of the prompt's material names", () => {
    const names = vocabulary(MATERIALS);
    assert.ok(names.length > 10);
    assert.ok(!names.some((n) => /UltraTech|Tata Steel|Saint-Gobain/.test(n)));
  });

  it("keeps a sized assembly and drops unknown or unsized ones", () => {
    const draft = parseDraft(
      reply({
        assemblies: [
          { assemblyId: "brick-clay-cm16", quantity: 2.3, basis: "10 m² × 0.23 m" },
          { assemblyId: "made-up", quantity: 1, basis: "" },
          { assemblyId: "aac-cm14", quantity: 0, basis: "" },
        ],
      }),
      ASSEMBLIES,
    );
    assert.deepEqual(draft.assemblies, [{ assemblyId: "brick-clay-cm16", quantity: 2.3, basis: "10 m² × 0.23 m" }]);
  });

  it("keeps other materials with whatever quantity and unit are usable", () => {
    const draft = parseDraft(
      reply({
        others: [
          { component: "Steel rebar (TMT), India generic", quantity: 90, unit: "kg", basis: "b" },
          { component: "Vitrified tile", quantity: -1, unit: "furlong", basis: "" },
          { component: " ", quantity: 1, unit: "kg", basis: "" },
        ],
      }),
      ASSEMBLIES,
    );
    assert.deepEqual(
      draft.others.map((o) => [o.component, o.quantity, o.unit]),
      [
        ["Steel rebar (TMT), India generic", 90, "kg"],
        ["Vitrified tile", null, null],
      ],
    );
  });

  it("returns nothing to add for out-of-scope requests", () => {
    const draft = parseDraft(
      reply({
        inScope: false,
        reason: "A phone is not a construction product.",
        assemblies: [{ assemblyId: "brick-clay-cm16", quantity: 1, basis: "" }],
      }),
      ASSEMBLIES,
    );
    assert.equal(draft.inScope, false);
    assert.equal(draft.assemblies.length + draft.others.length, 0);
  });

  it("rejects replies that aren't JSON or lack the shape", () => {
    assert.throws(() => parseDraft("not json", ASSEMBLIES), /valid JSON/);
    assert.throws(() => parseDraft("{}", ASSEMBLIES), /expected shape/);
  });
});
