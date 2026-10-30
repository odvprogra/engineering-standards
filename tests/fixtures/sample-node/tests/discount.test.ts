import { describe, expect, it } from "vitest";

import { applyDiscount } from "../src/discount.ts";

describe("applyDiscount", () => {
  it("reduces the amount by the percentage", () => {
    const result = applyDiscount(20_000, 10);

    expect(result).toBe(18_000);
  });

  it("rounds a half cent up", () => {
    const result = applyDiscount(25, 50);

    expect(result).toBe(13);
  });

  it.each([-1, 100.01])("rejects %d percent", (percent) => {
    expect(() => applyDiscount(1_000, percent)).toThrow("between 0 and 100");
  });

  it("rejects fractions of a cent", () => {
    expect(() => applyDiscount(10.5, 10)).toThrow("integer");
  });
});
