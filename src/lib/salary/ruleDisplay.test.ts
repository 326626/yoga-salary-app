import { describe, expect, it } from "vitest";

import { describeClassFeeRule, describeCommissionRule } from "./ruleDisplay";

describe("ruleDisplay", () => {
  it("describes fixed_per_class as per-class amount", () => {
    expect(describeClassFeeRule({ course_type: "group", fee_type: "fixed_per_class", amount: 100 })).toContain("每节 100.00 元");
  });

  it("describes percentage_of_unit_price as package unit price percentage", () => {
    expect(describeClassFeeRule({ course_type: "private", fee_type: "percentage_of_unit_price", rate: 0.4 })).toContain(
      "按课包单节成交价的 40%"
    );
  });

  it("describes none as no class fee", () => {
    expect(describeClassFeeRule({ course_type: "trial", fee_type: "none", amount: 0 })).toContain("不计课时费");
  });

  it("describes commission rule with range and percentage", () => {
    expect(describeCommissionRule({ min_amount: 10000, max_amount: 30000, rate: 0.05 })).toBe("10000.00 - 30000.00 元：5%");
    expect(describeCommissionRule({ min_amount: 30000, max_amount: null, rate: 0.08 })).toBe("30000.00 元以上：8%");
  });
});
