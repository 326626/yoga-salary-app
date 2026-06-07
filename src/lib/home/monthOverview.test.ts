import { describe, expect, it } from "vitest";

import { activeMockSalaryRule, mockClasses, mockPackages, mockPerformances, mockSalaryCalculations, mockTeachers } from "@/lib/mock-data";

import { buildHomeMonthOverview } from "./monthOverview";

describe("home month overview", () => {
  it("counts current month classes", () => {
    const overview = buildHomeMonthOverview({
      loggedIn: true,
      month: "2026-06",
      teachers: mockTeachers,
      classes: mockClasses,
      performances: mockPerformances,
      packages: mockPackages,
      activeSalaryRule: activeMockSalaryRule,
      salaryCalculations: mockSalaryCalculations
    });

    expect(overview.classCount).toBe(mockClasses.filter((item) => item.date.startsWith("2026-06-")).length);
  });

  it("sums commissionable performance amount for current month", () => {
    const overview = buildHomeMonthOverview({
      loggedIn: true,
      month: "2026-06",
      teachers: mockTeachers,
      classes: mockClasses,
      performances: mockPerformances,
      packages: mockPackages,
      activeSalaryRule: activeMockSalaryRule,
      salaryCalculations: mockSalaryCalculations
    });

    expect(overview.performanceTotal).toBe(
      mockPerformances.filter((item) => item.date.startsWith("2026-06-") && item.commissionable).reduce((sum, item) => sum + item.amount, 0)
    );
  });

  it("returns a rule setup message when salary rule is missing", () => {
    const overview = buildHomeMonthOverview({
      loggedIn: true,
      month: "2026-06",
      teachers: mockTeachers,
      classes: mockClasses,
      performances: mockPerformances,
      packages: mockPackages,
      activeSalaryRule: null,
      salaryCalculations: []
    });

    expect(overview.estimatedSalary).toBeNull();
    expect(overview.message).toContain("设置工资规则");
  });

  it("returns demo state when not logged in", () => {
    const overview = buildHomeMonthOverview({
      loggedIn: false,
      month: "2026-06",
      teachers: mockTeachers,
      classes: mockClasses,
      performances: mockPerformances,
      packages: mockPackages,
      activeSalaryRule: activeMockSalaryRule,
      salaryCalculations: []
    });

    expect(overview.mode).toBe("demo");
    expect(overview.message).toContain("登录后");
  });
});
