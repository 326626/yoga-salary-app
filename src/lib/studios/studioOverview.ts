import { filterSalaryData } from "@/lib/salary/filterSalaryData";
import { selectSalaryRule, type SelectSalaryRuleResult } from "@/lib/salary/selectSalaryRule";
import type { ClassRecord, MemberPackage, Performance, SalaryRule } from "@/types";

export function buildUnassignedNotice(counts: { classes: number; performances: number; packages?: number; total: number }) {
  if (counts.total <= 0) return "";
  return `有 ${counts.total} 条记录还没有选择瑜伽馆。全部计算时会包含它们，但按地点计算时不会出现～`;
}

export function getStudioRuleLabel(result: SelectSalaryRuleResult, studioId?: string) {
  if (!result.rule) return "还没有可用工资规则";
  if (studioId && result.rule.studio_id === studioId) return "使用专属工资规则";
  if (!result.rule.studio_id) return "使用通用工资规则";
  return "使用最近启用的工资规则";
}

export function calculateStudioMonthOverview(params: {
  classes: ClassRecord[];
  performances: Performance[];
  packages: MemberPackage[];
  salaryRules: SalaryRule[];
  studioId?: string;
  month: string;
}) {
  const filtered = filterSalaryData({
    classes: params.classes,
    performances: params.performances,
    packages: params.packages,
    studioId: params.studioId
  });
  const monthlyClasses = filtered.classes.filter((item) => item.date.startsWith(params.month));
  const monthlyPerformances = filtered.performances.filter((item) => item.date.startsWith(params.month));
  const selectedRule = selectSalaryRule(params.salaryRules, params.studioId);

  return {
    classCount: monthlyClasses.length,
    performanceTotal: monthlyPerformances.filter((item) => item.commissionable).reduce((total, item) => total + item.amount, 0),
    classes: monthlyClasses,
    performances: monthlyPerformances,
    packages: filtered.packages,
    selectedRule,
    ruleLabel: getStudioRuleLabel(selectedRule, params.studioId)
  };
}
