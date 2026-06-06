import { describe, expect, it } from "vitest";

import { activeMockSalaryRule, mockClasses, mockPackages, mockPerformances, mockTeachers } from "@/lib/mock-data";

import { calculateMonthlySalary } from "./calculateMonthlySalary";

function salaryRule() {
  if (!activeMockSalaryRule) {
    throw new Error("active mock salary rule is required");
  }

  return activeMockSalaryRule.structured_rule;
}

describe("calculateMonthlySalary", () => {
  it("calculates Zhang teacher monthly salary from mock data with detailed breakdown", () => {
    const result = calculateMonthlySalary({
      teacherId: mockTeachers[0].id,
      month: "2026-06",
      classes: mockClasses,
      performances: mockPerformances,
      packages: mockPackages,
      salaryRule: salaryRule()
    });

    expect(result.classFeeTotal).toBe(420);
    expect(result.performanceTotal).toBe(8899);
    expect(result.commissionTotal).toBe(266.97);
    expect(result.salaryTotal).toBe(result.classFeeTotal + result.commissionTotal + result.bonusTotal - result.deductionTotal);
    expect(result.breakdown.classFees).toHaveLength(4);
    expect(result.breakdown.commissions).toHaveLength(1);
    expect(result.breakdown.warnings.some((warning) => warning.includes("私教课缺少课包"))).toBe(true);
  });
});
