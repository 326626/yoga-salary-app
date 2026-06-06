import { describe, expect, it } from "vitest";

import { parseSalaryRuleText } from "./parseSalaryRule";
import type { AiProvider } from "./provider";

describe("parseSalaryRuleText", () => {
  it("validates structured JSON returned by an AI provider", async () => {
    const provider: AiProvider = {
      name: "test-provider",
      async parseSalaryRuleFromText() {
        return {
          structured_rule: {
            class_fee_rules: [
              {
                course_type: "private",
                fee_type: "fixed_per_class",
                amount: 150
              }
            ],
            commission_rules: [],
            commission_mode: "unknown",
            bonus_rules: [],
            deduction_rules: [],
            uncertain_items: []
          }
        };
      }
    };

    await expect(parseSalaryRuleText("私教课 150 元/节", provider)).resolves.toMatchObject({
      structured_rule: {
        class_fee_rules: [
          {
            course_type: "private",
            amount: 150
          }
        ]
      }
    });
  });

  it("fails when provider returns invalid structure", async () => {
    const provider: AiProvider = {
      name: "bad-provider",
      async parseSalaryRuleFromText() {
        return {
          structured_rule: {
            class_fee_rules: [
              {
                course_type: "private",
                fee_type: "percentage_of_unit_price",
                rate: 2
              }
            ],
            commission_rules: [],
            commission_mode: "unknown",
            bonus_rules: [],
            deduction_rules: [],
            uncertain_items: []
          }
        };
      }
    };

    await expect(parseSalaryRuleText("私教 200%", provider)).rejects.toThrow();
  });

  it("accepts JSON code block returned by provider", async () => {
    const provider: AiProvider = {
      name: "code-block-provider",
      async parseSalaryRuleFromText() {
        return {
          raw_ai_text: `\`\`\`json
{
  "class_fee_rules": [
            {
              "course_type": "private",
              "fee_type": "fixed_per_class",
              "amount": 150
            }
          ],
  "commission_rules": [],
  "commission_mode": "unknown",
  "bonus_rules": [],
  "deduction_rules": [],
  "uncertain_items": []
}
\`\`\``,
          structured_rule: {
            class_fee_rules: [],
            commission_rules: [],
            commission_mode: "unknown",
            bonus_rules: [],
            deduction_rules: [],
            uncertain_items: []
          }
        };
      }
    };

    await expect(parseSalaryRuleText("私教课 150 元/节", provider)).resolves.toMatchObject({
      structured_rule: {
        class_fee_rules: [{ course_type: "private", amount: 150 }]
      }
    });
  });
});
