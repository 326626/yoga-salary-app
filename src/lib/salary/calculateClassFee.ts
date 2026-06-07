import type { ClassRecord, MemberPackage, PackageItem, StructuredSalaryRule } from "@/types";

import { formatMoney, roundMoney } from "./formatMoney";

export type ClassFeeBreakdownItem = {
  classId: string;
  date: string;
  courseName: string;
  courseType: string;
  memberId?: string;
  packageId?: string;
  packageItemId?: string;
  formula: string;
  amount: number;
  warning?: string;
};

export type CalculateClassFeeResult = {
  total: number;
  classFees: ClassFeeBreakdownItem[];
  warnings: string[];
};

type CalculateClassFeeInput = {
  classes: ClassRecord[];
  packages: MemberPackage[];
  packageItems?: PackageItem[];
  salaryRule: StructuredSalaryRule;
};

function buildMissingPackageWarning(classRecord: ClassRecord) {
  return `${classRecord.date} 私教课缺少课包，无法按单节成交价计算课时费。`;
}

function buildInvalidPackageWarning(classRecord: ClassRecord) {
  return `${classRecord.date} 私教课课包单节成交价无效，无法按单节成交价计算课时费。`;
}

export function calculateClassFee({ classes, packages, packageItems = [], salaryRule }: CalculateClassFeeInput): CalculateClassFeeResult {
  const warnings: string[] = [];

  const classFees = classes.map((classRecord): ClassFeeBreakdownItem => {
    const baseItem = {
      classId: classRecord.id,
      date: classRecord.date,
      courseName: classRecord.course_name,
      courseType: classRecord.course_type,
      memberId: classRecord.member_id ?? undefined,
      packageId: classRecord.package_id ?? undefined,
      packageItemId: classRecord.package_item_id ?? undefined
    };
    const rule = salaryRule.class_fee_rules.find((item) => item.course_type === classRecord.course_type);

    if (!rule) {
      const warning = `${classRecord.date} ${classRecord.course_name} 没有匹配的课时费规则。`;
      warnings.push(warning);
      return {
        ...baseItem,
        formula: "未匹配规则，课时费记为 0 元",
        amount: 0,
        warning
      };
    }

    if (rule.fee_type === "none") {
      return {
        ...baseItem,
        formula: "规则为不计课时费，金额 0 元",
        amount: 0
      };
    }

    if (rule.fee_type === "fixed_per_class") {
      const amount = roundMoney(rule.amount * classRecord.hours);
      return {
        ...baseItem,
        formula: `${formatMoney(rule.amount)} 元/节 × ${classRecord.hours} = ${formatMoney(amount)} 元`,
        amount
      };
    }

    if (rule.fee_type === "fixed_per_hour") {
      const amount = roundMoney(rule.amount * classRecord.hours);
      return {
        ...baseItem,
        formula: `${formatMoney(rule.amount)} 元/小时 × ${classRecord.hours} = ${formatMoney(amount)} 元`,
        amount
      };
    }

    const packageItem = classRecord.package_item_id
      ? packageItems.find((item) => item.id === classRecord.package_item_id)
      : undefined;
    const memberPackage = classRecord.package_id
      ? packages.find((item) => item.id === classRecord.package_id)
      : undefined;
    const unitPrice = packageItem?.unit_price ?? memberPackage?.unit_price;

    if (!memberPackage && !packageItem) {
      const warning = buildMissingPackageWarning(classRecord);
      warnings.push(warning);
      return {
        ...baseItem,
        formula: "缺少课包，课时费记为 0 元",
        amount: 0,
        warning
      };
    }

    if (!unitPrice || unitPrice <= 0) {
      const warning = buildInvalidPackageWarning(classRecord);
      warnings.push(warning);
      return {
        ...baseItem,
        formula: "课包单节成交价无效，课时费记为 0 元",
        amount: 0,
        warning
      };
    }

    const amount = roundMoney(unitPrice * rule.rate * classRecord.hours);
    return {
      ...baseItem,
      formula: `${formatMoney(unitPrice)} 元 × ${rule.rate * 100}% × ${classRecord.hours} = ${formatMoney(amount)} 元`,
      amount
    };
  });

  return {
    total: roundMoney(classFees.reduce((sum, item) => sum + item.amount, 0)),
    classFees,
    warnings
  };
}
