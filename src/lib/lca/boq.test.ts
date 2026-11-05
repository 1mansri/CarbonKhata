import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectColumns, matchBoq, parseBoqUnit, parseQuantity } from "@/lib/lca/boq";
import { MATERIALS } from "@/data/lca/materials";

describe("BoQ import", () => {
  it("finds description, quantity and unit columns by header", () => {
    assert.deepEqual(detectColumns(["Sl No", "Description of item", "Qty", "Unit", "Rate"]), {
      description: "Description of item",
      quantity: "Qty",
      unit: "Unit",
    });
    // CPWD layout: serial "Item No." first, money "Amount" last.
    assert.deepEqual(detectColumns(["Item No.", "Description of Item", "Unit", "Quantity", "Rate", "Amount"]), {
      description: "Description of Item",
      quantity: "Quantity",
      unit: "Unit",
    });
  });

  it("only treats bags as 50 kg for cement", () => {
    const cols = { description: "d", quantity: "q", unit: "u" };
    const [cement, sand] = matchBoq(
      [
        { d: "Portland pozzolana cement", q: "10", u: "Bags" },
        { d: "Coarse sand", q: "10", u: "Bags" },
      ],
      cols,
      MATERIALS,
    );
    assert.deepEqual(cement.unit, { unit: "kg", factor: 50 });
    assert.equal(sand.unit, null);
  });

  it("reads Indian BoQ units, including quintals and cement bags", () => {
    assert.deepEqual(parseBoqUnit("Cum"), { unit: "m3", factor: 1 });
    assert.deepEqual(parseBoqUnit(" MT "), { unit: "t", factor: 1 });
    assert.deepEqual(parseBoqUnit("Qtl"), { unit: "kg", factor: 100 });
    assert.deepEqual(parseBoqUnit("bags"), { unit: "kg", factor: 50 });
    assert.deepEqual(parseBoqUnit("RM"), { unit: "m", factor: 1 });
    assert.deepEqual(parseBoqUnit("Ltr"), { unit: "L", factor: 1 });
    assert.equal(parseBoqUnit("LS"), null); // lump sum has no physical quantity
  });

  it("parses quantities with Indian thousands separators", () => {
    assert.equal(parseQuantity("1,25,000.5"), 125000.5);
    assert.equal(parseQuantity(""), null);
    assert.equal(parseQuantity("n/a"), null);
  });

  it("suggests a library material for each described row", () => {
    const lines = matchBoq(
      [{ Item: "Cement OPC 53 grade", Qty: "120", Unit: "MT" }, { Item: "", Qty: "1", Unit: "kg" }],
      { description: "Item", quantity: "Qty", unit: "Unit" },
      MATERIALS,
    );
    assert.equal(lines.length, 1);
    assert.equal(lines[0].match?.category, "Cement & binders");
    assert.equal(lines[0].quantity, 120);
  });

  it("understands CPWD-style descriptions", () => {
    const cols = { description: "d", quantity: "q", unit: "u" };
    const match = (d: string) => matchBoq([{ d, q: "1", u: "MT" }], cols, MATERIALS)[0];
    assert.match(match("Providing and laying ready mix concrete M30 grade").match!.name, /Ready-mix concrete M30/);
    // Unknown brand → the generic Indian bar, never a low-carbon scrap product by accident.
    assert.equal(match("TMT reinforcement bars Fe 500D").match!.name, "Steel rebar (TMT), India generic");
    assert.equal(match("Brick masonry with fired clay bricks").match!.name, "Fired clay brick, India average");
    assert.match(match("Portland pozzolana cement (PPC)").match!.name, /^PPC/);
    assert.equal(match("Coarse sand for plaster").match!.name, "Sand, India generic");
    assert.equal(match("Centering and shuttering with plywood").confidence, 0);
  });
});
