import { describe, expect, it } from "vitest";

import { structuredSalaryRuleSchema } from "@/lib/validation";

import { mockParseSalaryRule } from "./mockParseSalaryRule";

describe("mockParseSalaryRule", () => {
  it("parses salary rule text with core keywords into the standard structured rule", () => {
    const result = mockParseSalaryRule(
      "团课每节 100 元，代课每节 80 元，体验课不计课时费。私教课时费按会员课包单节成交价的 40%。业绩 0-10000 提成 3%，10000-30000 提成 5%，30000 以上提成 8%。"
    );

    expect(result.class_fee_rules).toHaveLength(4);
    expect(result.commission_rules).toHaveLength(3);
    expect(result.commission_mode).toBe("tiered");
  });

  it("returns uncertain_items when text is too short or unclear", () => {
    const result = mockParseSalaryRule("按店里规则算");

    expect(result.class_fee_rules).toEqual([]);
    expect(result.uncertain_items).toContain("未识别到明确的私教课时费规则");
    expect(result.uncertain_items).toContain("未识别到明确的业绩提成规则");
  });

  it("returns a rule compatible with structuredSalaryRuleSchema", () => {
    const result = mockParseSalaryRule(
      "团课每节 100 元，代课每节 80 元，体验课不计课时费。私教课时费按会员课包单节成交价的 40%。业绩 0-10000 提成 3%，10000-30000 提成 5%，30000 以上提成 8%。"
    );

    expect(structuredSalaryRuleSchema.safeParse(result).success).toBe(true);
  });

  it("recognizes private unit price percentage wording", () => {
    const result = mockParseSalaryRule("私教按客单价40%");

    expect(result.class_fee_rules).toContainEqual({
      course_type: "private",
      fee_type: "percentage_of_unit_price",
      rate: 0.4
    });
  });
});
