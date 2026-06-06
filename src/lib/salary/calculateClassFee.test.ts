import { describe, expect, it } from "vitest";

import { activeMockSalaryRule, mockClasses, mockPackages } from "@/lib/mock-data";

import { calculateClassFee } from "./calculateClassFee";

function salaryRule() {
  if (!activeMockSalaryRule) {
    throw new Error("active mock salary rule is required");
  }

  return activeMockSalaryRule.structured_rule;
}

describe("calculateClassFee", () => {
  it("calculates fixed_per_class for group classes", () => {
    const classRecord = mockClasses.find((item) => item.course_type === "group");
    const result = calculateClassFee({ classes: classRecord ? [classRecord] : [], packages: mockPackages, salaryRule: salaryRule() });

    expect(result.total).toBe(100);
    expect(result.classFees[0].formula).toContain("100.00 元/节");
  });

  it("calculates fixed_per_class for substitute classes", () => {
    const classRecord = mockClasses.find((item) => item.course_type === "substitute");
    const result = calculateClassFee({ classes: classRecord ? [classRecord] : [], packages: mockPackages, salaryRule: salaryRule() });

    expect(result.total).toBe(80);
  });

  it("calculates private class fee from Li's 300 yuan unit price at 40%", () => {
    const classRecord = mockClasses.find((item) => item.package_id === mockPackages[0].id);
    const result = calculateClassFee({ classes: classRecord ? [classRecord] : [], packages: mockPackages, salaryRule: salaryRule() });

    expect(result.total).toBe(120);
    expect(result.classFees[0].formula).toContain("300.00 元 × 40%");
  });

  it("calculates private class fee from Chen's 500 yuan unit price at 40%", () => {
    const classRecord = mockClasses.find((item) => item.package_id === mockPackages[1].id);
    const result = calculateClassFee({ classes: classRecord ? [classRecord] : [], packages: mockPackages, salaryRule: salaryRule() });

    expect(result.total).toBe(200);
    expect(result.classFees[0].formula).toContain("500.00 元 × 40%");
  });

  it("returns warning and zero amount when private class misses package_id", () => {
    const classRecord = mockClasses.find((item) => item.course_type === "private" && item.package_id === null);
    const result = calculateClassFee({ classes: classRecord ? [classRecord] : [], packages: mockPackages, salaryRule: salaryRule() });

    expect(result.total).toBe(0);
    expect(result.classFees[0].warning).toContain("私教课缺少课包");
    expect(result.warnings[0]).toContain("私教课缺少课包");
  });

  it("returns zero for trial class with none rule", () => {
    const classRecord = mockClasses.find((item) => item.course_type === "trial");
    const result = calculateClassFee({ classes: classRecord ? [classRecord] : [], packages: mockPackages, salaryRule: salaryRule() });

    expect(result.total).toBe(0);
    expect(result.classFees[0].warning).toBeUndefined();
  });

  it("returns warning when no class fee rule matches", () => {
    const classRecord = mockClasses.find((item) => item.course_type === "group");
    const result = calculateClassFee({
      classes: classRecord ? [classRecord] : [],
      packages: mockPackages,
      salaryRule: {
        ...salaryRule(),
        class_fee_rules: []
      }
    });

    expect(result.total).toBe(0);
    expect(result.warnings[0]).toContain("没有匹配的课时费规则");
  });
});
