import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatInput } from "@/components/ui/number-input";

describe("quantity display", () => {
  it("rounds what you read, by size", () => {
    assert.equal(formatInput(345.6327875), "345.63");
    assert.equal(formatInput(312713.86), "312,713.86");
    assert.equal(formatInput(17707.4498), "17,707.45");
    assert.equal(formatInput(4.12345), "4.123");
    assert.equal(formatInput(0.7188), "0.7188");
  });

  it("keeps small factors meaningful instead of rounding them to zero", () => {
    assert.equal(formatInput(0.000123456), "0.0001235");
    assert.equal(formatInput(0), "0");
  });
});
