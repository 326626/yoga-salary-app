import type { SalaryRule } from "@/types";

export type SelectSalaryRuleResult = {
  rule: SalaryRule | null;
  message?: string;
};

export function selectSalaryRule(salaryRules: SalaryRule[], studioId?: string): SelectSalaryRuleResult {
  const activeRules = salaryRules.filter((rule) => rule.active);
  if (activeRules.length === 0) {
    return { rule: null, message: "还没有启用工资规则，先设置一下工资规则～" };
  }

  if (studioId) {
    const studioRule = activeRules.find((rule) => rule.studio_id === studioId);
    if (studioRule) return { rule: studioRule };
    const commonRule = activeRules.find((rule) => !rule.studio_id);
    if (commonRule) return { rule: commonRule, message: "当前瑜伽馆还没有专属规则，先使用通用规则计算～" };
    return { rule: null, message: "这个瑜伽馆还没有启用工资规则，先设置一下吧～" };
  }

  const commonRule = activeRules.find((rule) => !rule.studio_id);
  if (commonRule) return { rule: commonRule };

  return {
    rule: activeRules[0],
    message: "还没有通用规则，先使用最近启用的一套规则计算～"
  };
}
