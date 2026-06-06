import { describe, expect, it } from "vitest";

import { calculateSettlementDifference, getSettlementLabel, getSettlementTone } from "./settlement";

describe("settlement helpers", () => {
  it("handles actual paid amount equal to expected salary", () => {
    expect(calculateSettlementDifference(6600, 6600)).toBe(0);
    expect(getSettlementLabel(6600, 6600)).toBe("和预计工资一致");
    expect(getSettlementTone(6600, 6600)).toBe("neutral");
  });

  it("handles actual paid amount greater than expected salary", () => {
    expect(calculateSettlementDifference(6600, 6700)).toBe(100);
    expect(getSettlementLabel(6600, 6700)).toBe("比预计多 ¥100.00");
    expect(getSettlementTone(6600, 6700)).toBe("positive");
  });

  it("handles actual paid amount less than expected salary", () => {
    expect(calculateSettlementDifference(6600, 6500)).toBe(-100);
    expect(getSettlementLabel(6600, 6500)).toBe("比预计少 ¥100.00");
    expect(getSettlementTone(6600, 6500)).toBe("negative");
  });
});
