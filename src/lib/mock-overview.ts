import { activeMockSalaryRule, mockClasses, mockPackages, mockPerformances, mockTeachers } from "./mock-data";
import { calculateMonthlySalary } from "./salary/calculateMonthlySalary";
import type { StructuredSalaryRule } from "@/types";

const emptySalaryRule: StructuredSalaryRule = {
  class_fee_rules: [],
  commission_rules: [],
  commission_mode: "unknown",
  bonus_rules: [],
  deduction_rules: [],
  uncertain_items: []
};

export const mockOverviewMonth = "2026-06";
export const mockOverviewTeacher = mockTeachers[0];
export const mockMonthlySalaryOverview = calculateMonthlySalary({
  teacherId: mockOverviewTeacher.id,
  month: mockOverviewMonth,
  classes: mockClasses,
  performances: mockPerformances,
  packages: mockPackages,
  salaryRule: activeMockSalaryRule?.structured_rule ?? emptySalaryRule
});
