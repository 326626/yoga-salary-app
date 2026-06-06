import type { StructuredSalaryRule } from "@/types";

export function mockParseSalaryRule(ruleText: string): StructuredSalaryRule {
  const normalizedText = ruleText.trim();
  const hasCoreKeywords =
    normalizedText.includes("团课") &&
    normalizedText.includes("100") &&
    normalizedText.includes("代课") &&
    normalizedText.includes("80") &&
    normalizedText.includes("体验课") &&
    normalizedText.includes("私教") &&
    (normalizedText.includes("40%") || normalizedText.includes("40％")) &&
    normalizedText.includes("业绩") &&
    normalizedText.includes("3%") &&
    normalizedText.includes("5%") &&
    normalizedText.includes("8%");

  if (!hasCoreKeywords) {
    const privateRateMatch = normalizedText.match(/私教.*?(?:客单价|成交价|成交单价|实收单价|课包单节价格).*?(40%|40％|百分之四十)/);
    if (privateRateMatch) {
      return {
        class_fee_rules: [
          {
            course_type: "private",
            fee_type: "percentage_of_unit_price",
            rate: 0.4
          }
        ],
        commission_rules: [],
        commission_mode: "unknown",
        bonus_rules: [],
        deduction_rules: [],
        uncertain_items: ["未识别到明确的业绩提成规则"]
      };
    }

    return {
      class_fee_rules: [],
      commission_rules: [],
      commission_mode: "unknown",
      bonus_rules: [],
      deduction_rules: [],
      uncertain_items: [
        "未识别到明确的私教课时费规则",
        "未识别到明确的业绩提成规则"
      ]
    };
  }

  return {
    class_fee_rules: [
      {
        course_type: "group",
        fee_type: "fixed_per_class",
        amount: 100
      },
      {
        course_type: "private",
        fee_type: "percentage_of_unit_price",
        rate: 0.4
      },
      {
        course_type: "trial",
        fee_type: "none",
        amount: 0
      },
      {
        course_type: "substitute",
        fee_type: "fixed_per_class",
        amount: 80
      }
    ],
    commission_rules: [
      {
        min_amount: 0,
        max_amount: 10000,
        rate: 0.03
      },
      {
        min_amount: 10000,
        max_amount: 30000,
        rate: 0.05
      },
      {
        min_amount: 30000,
        max_amount: null,
        rate: 0.08
      }
    ],
    commission_mode: "tiered",
    bonus_rules: [],
    deduction_rules: [],
    uncertain_items: []
  };
}
