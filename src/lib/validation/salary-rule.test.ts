import { describe, expect, it } from "vitest";

import { parsedSalaryRuleSchema } from "./salary-rule";

describe("parsedSalaryRuleSchema", () => {
  it("accepts a draft rule with fixed class pay and percentage commission", () => {
    const result = parsedSalaryRuleSchema.safeParse({
      name: "林老师 2026 工资规则",
      status: "draft",
      classPayRules: [
        {
          classType: "private",
          payType: "fixed",
          amount: 120
        }
      ],
      performanceCommissionRules: [
        {
          category: "new_package",
          commissionType: "percentage",
          percentage: 8
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects active rules from AI parsing", () => {
    const result = parsedSalaryRuleSchema.safeParse({
      name: "不能直接生效的规则",
      status: "active",
      classPayRules: [],
      performanceCommissionRules: []
    });

    expect(result.success).toBe(false);
  });
});
