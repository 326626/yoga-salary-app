import type { ClassRecord, MemberPackage, PackageItem, Performance, StructuredSalaryRule } from "@/types";

import { calculateClassFee, type ClassFeeBreakdownItem } from "./calculateClassFee";
import { calculateCommission, type CommissionBreakdownItem } from "./calculateCommission";
import { roundMoney } from "./formatMoney";

export type CalculateMonthlySalaryInput = {
  teacherId: string;
  month: string;
  classes: ClassRecord[];
  performances: Performance[];
  packages: MemberPackage[];
  packageItems?: PackageItem[];
  salaryRule: StructuredSalaryRule;
};

export type MonthlySalaryResult = {
  teacherId: string;
  month: string;
  classFeeTotal: number;
  performanceTotal: number;
  commissionTotal: number;
  bonusTotal: number;
  deductionTotal: number;
  salaryTotal: number;
  breakdown: {
    classFees: ClassFeeBreakdownItem[];
    commissions: CommissionBreakdownItem[];
    warnings: string[];
  };
};

function isInMonth(date: string, month: string) {
  return date.startsWith(`${month}-`);
}

export function calculateMonthlySalary(input: CalculateMonthlySalaryInput): MonthlySalaryResult {
  const monthlyClasses = input.classes.filter(
    (classRecord) => classRecord.teacher_id === input.teacherId && isInMonth(classRecord.date, input.month)
  );
  const monthlyPerformances = input.performances.filter(
    (performance) => performance.teacher_id === input.teacherId && isInMonth(performance.date, input.month)
  );

  const classFeeResult = calculateClassFee({
    classes: monthlyClasses,
    packages: input.packages,
    packageItems: input.packageItems,
    salaryRule: input.salaryRule
  });
  const commissionResult = calculateCommission({
    performances: monthlyPerformances,
    salaryRule: input.salaryRule
  });
  const bonusTotal = 0;
  const deductionTotal = 0;
  const salaryTotal = roundMoney(classFeeResult.total + commissionResult.commissionTotal + bonusTotal - deductionTotal);

  return {
    teacherId: input.teacherId,
    month: input.month,
    classFeeTotal: classFeeResult.total,
    performanceTotal: commissionResult.performanceTotal,
    commissionTotal: commissionResult.commissionTotal,
    bonusTotal,
    deductionTotal,
    salaryTotal,
    breakdown: {
      classFees: classFeeResult.classFees,
      commissions: commissionResult.commissions,
      warnings: [...classFeeResult.warnings, ...commissionResult.warnings]
    }
  };
}
