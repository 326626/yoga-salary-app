import { describe, expect, it } from "vitest";

import { mockClasses, mockPerformances, mockStudios } from "@/lib/mock-data";

import { filterClassesByStudio, filterPerformancesByStudio } from "./recordFilters";

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
});
