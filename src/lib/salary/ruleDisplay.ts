import type { ClassFeeRule, CommissionRule, StructuredSalaryRule } from "@/types";

import { formatMoney } from "./formatMoney";

const courseTypeLabels: Record<ClassFeeRule["course_type"], string> = {
  group: "团课",
  private: "私教",
  trial: "体验课",
  substitute: "代课",
  other: "其他"
};

function percent(rate: number) {
  return `${Number((rate * 100).toFixed(2))}%`;
}

export function describeClassFeeRule(rule: ClassFeeRule): string {
  const label = courseTypeLabels[rule.course_type];

  if (rule.fee_type === "fixed_per_class") {
    return `${label}：每节 ${formatMoney(rule.amount)} 元`;
  }

  if (rule.fee_type === "fixed_per_hour") {
    return `${label}：每小时 ${formatMoney(rule.amount)} 元`;
  }

  if (rule.fee_type === "percentage_of_unit_price") {
    return `${label}：按课包单节成交价的 ${percent(rule.rate)}`;
  }

  return `${label}：不计课时费`;
}

export function describeCommissionRule(rule: CommissionRule): string {
  if (rule.max_amount === null) {
    return `${formatMoney(rule.min_amount)} 元以上：${percent(rule.rate)}`;
  }

  return `${formatMoney(rule.min_amount)} - ${formatMoney(rule.max_amount)} 元：${percent(rule.rate)}`;
}

export function describeSalaryRule(rule: StructuredSalaryRule) {
  return {
    classFeeRules: rule.class_fee_rules.map(describeClassFeeRule),
    commissionRules: rule.commission_rules.map(describeCommissionRule),
    uncertainItems: rule.uncertain_items
  };
}
