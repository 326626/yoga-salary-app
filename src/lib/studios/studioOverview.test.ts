import { describe, expect, it } from "vitest";

import { mockClasses, mockPackages, mockPerformances, mockSalaryRules, mockStudios } from "@/lib/mock-data";

import { buildUnassignedNotice, calculateStudioMonthOverview, getStudioRuleLabel } from "./studioOverview";

describe("studio overview helpers", () => {
  it("builds notice when unassigned records exist", () => {
    expect(buildUnassignedNotice({ classes: 1, performances: 1, total: 2 })).toContain("2 条记录");
  });

  it("returns empty notice when there are no unassigned records", () => {
    expect(buildUnassignedNotice({ classes: 0, performances: 0, total: 0 })).toBe("");
  });

  it("counts only selected studio data", () => {
    const overview = calculateStudioMonthOverview({
      classes: mockClasses,
      performances: mockPerformances,
      packages: mockPackages,
      salaryRules: mockSalaryRules,
      studioId: mockStudios[0].id,
      month: "2026-06"
    });

    expect(overview.classes.every((item) => item.studio_id === mockStudios[0].id)).toBe(true);
    expect(overview.performances.every((item) => item.studio_id === mockStudios[0].id)).toBe(true);
  });

  it("includes unassigned data in all studios overview", () => {
    const overview = calculateStudioMonthOverview({
      classes: [{ ...mockClasses[0], studio_id: null }],
      performances: [{ ...mockPerformances[0], studio_id: null }],
      packages: mockPackages,
      salaryRules: mockSalaryRules,
      month: "2026-06"
    });

    expect(overview.classCount).toBe(1);
    expect(overview.performanceTotal).toBe(mockPerformances[0].amount);
  });

  it("labels studio specific and common rule", () => {
    expect(getStudioRuleLabel({ rule: { ...mockSalaryRules[0], studio_id: mockStudios[0].id } }, mockStudios[0].id)).toBe("使用专属工资规则");
    expect(getStudioRuleLabel({ rule: { ...mockSalaryRules[0], studio_id: null } }, mockStudios[0].id)).toBe("使用通用工资规则");
  });
});
