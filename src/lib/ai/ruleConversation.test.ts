import { describe, expect, it } from "vitest";

import { buildRuleConversationText } from "./ruleConversation";

const previousRule = {
  class_fee_rules: [],
  commission_rules: [],
  commission_mode: "unknown",
  bonus_rules: [],
  deduction_rules: [],
  uncertain_items: []
} as const;

describe("rule conversation", () => {
  it("combines raw text supplemental messages and extracted document text", () => {
    const result = buildRuleConversationText({
      rawText: "团课 100",
      supplementalMessage: "私教按客单价 40%",
      extractedTexts: ["业绩 0-10000 提成 3%"]
    });

    expect(result).toContain("团课 100");
    expect(result).toContain("私教按客单价 40%");
    expect(result).toContain("业绩 0-10000");
  });

  it("includes previous structured rule for multi-turn correction", () => {
    const result = buildRuleConversationText({
      supplementalMessage: "不对，团课是 120",
      previousStructuredRule: previousRule
    });

    expect(result).toContain("上一版结构化规则 JSON");
    expect(result).toContain("不对，团课是 120");
  });
});
