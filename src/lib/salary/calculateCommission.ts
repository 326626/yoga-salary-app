import type { CommissionRule } from "@/lib/salary/types";
import type { Performance, StructuredSalaryRule } from "@/types";

import { formatMoney, roundMoney } from "./formatMoney";

export type CommissionBreakdownItem = {
  rangeLabel: string;
  baseAmount: number;
  rate: number;
  amount: number;
  formula: string;
};

export type CalculateCommissionResult = {
  performanceTotal: number;
  commissionTotal: number;
  commissions: CommissionBreakdownItem[];
  warnings: string[];
};

type CalculateCommissionInput = {
  performances: Performance[];
  salaryRule: Pick<StructuredSalaryRule, "commission_rules" | "commission_mode">;
};

function rangeLabel(rule: CommissionRule) {
  return rule.max_amount === null ? `${formatMoney(rule.min_amount)} 以上` : `${formatMoney(rule.min_amount)}-${formatMoney(rule.max_amount)}`;
}

export function calculateCommission({ performances, salaryRule }: CalculateCommissionInput): CalculateCommissionResult {
  const performanceTotal = roundMoney(
    performances.filter((item) => item.commissionable).reduce((sum, item) => sum + item.amount, 0)
  );
  const sortedRules = [...salaryRule.commission_rules].sort((a, b) => a.min_amount - b.min_amount);

  if (performanceTotal <= 0) {
    return {
      performanceTotal: 0,
      commissionTotal: 0,
      commissions: [],
      warnings: []
    };
  }

  if (salaryRule.commission_mode === "unknown") {
    return {
      performanceTotal,
      commissionTotal: 0,
      commissions: [],
      warnings: ["业绩提成模式未知，未计算提成。"]
    };
  }

  if (salaryRule.commission_mode === "full_amount_rate") {
    const matchedRule = sortedRules
      .filter((rule) => performanceTotal >= rule.min_amount && (rule.max_amount === null || performanceTotal <= rule.max_amount))
      .at(-1);

    if (!matchedRule) {
      return {
        performanceTotal,
        commissionTotal: 0,
        commissions: [],
        warnings: ["没有匹配的业绩提成规则，未计算提成。"]
      };
    }

    const amount = roundMoney(performanceTotal * matchedRule.rate);
    return {
      performanceTotal,
      commissionTotal: amount,
      commissions: [
        {
          rangeLabel: rangeLabel(matchedRule),
          baseAmount: performanceTotal,
          rate: matchedRule.rate,
          amount,
          formula: `${formatMoney(performanceTotal)} 元 × ${matchedRule.rate * 100}% = ${formatMoney(amount)} 元`
        }
      ],
      warnings: []
    };
  }

  const commissions = sortedRules.flatMap((rule): CommissionBreakdownItem[] => {
    const upperLimit = rule.max_amount ?? performanceTotal;
    const baseAmount = roundMoney(Math.max(0, Math.min(performanceTotal, upperLimit) - rule.min_amount));

    if (baseAmount <= 0) {
      return [];
    }

    const amount = roundMoney(baseAmount * rule.rate);
    return [
      {
        rangeLabel: rangeLabel(rule),
        baseAmount,
        rate: rule.rate,
        amount,
        formula: `${formatMoney(baseAmount)} 元 × ${rule.rate * 100}% = ${formatMoney(amount)} 元`
      }
    ];
  });

  return {
    performanceTotal,
    commissionTotal: roundMoney(commissions.reduce((sum, item) => sum + item.amount, 0)),
    commissions,
    warnings: []
  };
}
