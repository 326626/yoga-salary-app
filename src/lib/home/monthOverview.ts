import { calculateMonthlySalary } from "@/lib/salary/calculateMonthlySalary";
import { roundMoney } from "@/lib/salary/formatMoney";
import type { ClassRecord, MemberPackage, PackageItem, Performance, SalaryCalculation, SalaryRule, Teacher } from "@/types";

export type HomeMonthOverview = {
  mode: "demo" | "real";
  month: string;
  classCount: number;
  performanceTotal: number;
  estimatedSalary: number | null;
  snapshotCount: number;
  message: string;
};

type BuildHomeMonthOverviewInput = {
  loggedIn: boolean;
  month: string;
  teachers: Teacher[];
  classes: ClassRecord[];
  performances: Performance[];
  packages: MemberPackage[];
  packageItems?: PackageItem[];
  activeSalaryRule?: SalaryRule | null;
  salaryCalculations?: SalaryCalculation[];
};

function isInMonth(date: string, month: string) {
  return date.startsWith(`${month}-`);
}

export function buildHomeMonthOverview(input: BuildHomeMonthOverviewInput): HomeMonthOverview {
  const monthClasses = input.classes.filter((item) => isInMonth(item.date, input.month));
  const monthPerformances = input.performances.filter((item) => isInMonth(item.date, input.month));
  const performanceTotal = roundMoney(
    monthPerformances.filter((item) => item.commissionable).reduce((sum, item) => sum + item.amount, 0)
  );
  const snapshotCount = input.salaryCalculations?.filter((item) => item.month === input.month).length ?? 0;

  if (!input.loggedIn) {
    return {
      mode: "demo",
      month: input.month,
      classCount: monthClasses.length,
      performanceTotal,
      estimatedSalary: null,
      snapshotCount,
      message: "登录后可以查看你的真实本月概览～"
    };
  }

  if (monthClasses.length === 0 && monthPerformances.length === 0) {
    return {
      mode: "real",
      month: input.month,
      classCount: 0,
      performanceTotal: 0,
      estimatedSalary: input.activeSalaryRule ? 0 : null,
      snapshotCount,
      message: "这个月还没有记录，先记一节课吧～"
    };
  }

  if (!input.activeSalaryRule || input.teachers.length === 0) {
    return {
      mode: "real",
      month: input.month,
      classCount: monthClasses.length,
      performanceTotal,
      estimatedSalary: null,
      snapshotCount,
      message: "设置工资规则后可以预估工资～"
    };
  }

  const result = calculateMonthlySalary({
    teacherId: input.teachers[0].id,
    month: input.month,
    classes: input.classes,
    performances: input.performances,
    packages: input.packages,
    packageItems: input.packageItems,
    salaryRule: input.activeSalaryRule.structured_rule
  });

  return {
    mode: "real",
    month: input.month,
    classCount: monthClasses.length,
    performanceTotal,
    estimatedSalary: result.salaryTotal,
    snapshotCount,
    message: snapshotCount > 0 ? "本月工资快照已保存～" : ""
  };
}
