import { describe, expect, it } from "vitest";

import { mockClasses, mockPerformances, mockStudios } from "@/lib/mock-data";

import { filterClasses, filterClassesByStudio, filterPerformances, filterPerformancesByStudio, summarizePerformances } from "./recordFilters";

describe("recordFilters", () => {
  it("returns all classes for all filter", () => {
    expect(filterClassesByStudio(mockClasses, "all")).toHaveLength(mockClasses.length);
  });

  it("returns unassigned classes only", () => {
    const records = [{ ...mockClasses[0], studio_id: null }, { ...mockClasses[1], studio_id: mockStudios[0].id }];

    expect(filterClassesByStudio(records, "unassigned")).toEqual([records[0]]);
  });

  it("returns classes for selected studio", () => {
    expect(filterClassesByStudio(mockClasses, mockStudios[0].id).every((item) => item.studio_id === mockStudios[0].id)).toBe(true);
  });

  it("returns all performances for all filter", () => {
    expect(filterPerformancesByStudio(mockPerformances, "all")).toHaveLength(mockPerformances.length);
  });

  it("returns unassigned performances only", () => {
    const records = [{ ...mockPerformances[0], studio_id: null }, { ...mockPerformances[1], studio_id: mockStudios[0].id }];

    expect(filterPerformancesByStudio(records, "unassigned")).toEqual([records[0]]);
  });

  it("returns performances for selected studio", () => {
    expect(filterPerformancesByStudio(mockPerformances, mockStudios[0].id).every((item) => item.studio_id === mockStudios[0].id)).toBe(true);
  });

  it("filters classes by month studio and member", () => {
    const records = [
      { ...mockClasses[0], date: "2026-06-10", studio_id: mockStudios[0].id, member_id: "member-1" },
      { ...mockClasses[1], date: "2026-05-10", studio_id: mockStudios[0].id, member_id: "member-1" },
      { ...mockClasses[2], date: "2026-06-12", studio_id: "studio-2", member_id: "member-1" }
    ];

    expect(filterClasses(records, { month: "2026-06", studioId: mockStudios[0].id, memberId: "member-1" })).toEqual([records[0]]);
  });

  it("filters performances by month studio member and commissionable", () => {
    const records = [
      { ...mockPerformances[0], date: "2026-06-10", studio_id: mockStudios[0].id, member_id: "member-1", commissionable: true, amount: 100 },
      { ...mockPerformances[1], date: "2026-06-11", studio_id: mockStudios[0].id, member_id: "member-1", commissionable: false, amount: 200 },
      { ...mockPerformances[2], date: "2026-05-12", studio_id: mockStudios[0].id, member_id: "member-1", commissionable: true, amount: 300 }
    ];

    expect(filterPerformances(records, { month: "2026-06", studioId: mockStudios[0].id, memberId: "member-1", commissionable: "true" })).toEqual([records[0]]);
  });

  it("summarizes performance totals", () => {
    const summary = summarizePerformances([
      { ...mockPerformances[0], amount: 100, commissionable: true },
      { ...mockPerformances[1], amount: 200, commissionable: false }
    ]);

    expect(summary.totalAmount).toBe(300);
    expect(summary.commissionableTotal).toBe(100);
    expect(summary.count).toBe(2);
  });
});
