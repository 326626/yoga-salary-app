import { describe, expect, it } from "vitest";

import { mockClasses, mockPackages, mockPerformances, mockStudios } from "@/lib/mock-data";

import { filterSalaryData } from "./filterSalaryData";

describe("filterSalaryData", () => {
  it("returns all data without studioId", () => {
    const result = filterSalaryData({ classes: mockClasses, performances: mockPerformances, packages: mockPackages });

    expect(result.classes).toHaveLength(mockClasses.length);
    expect(result.performances).toHaveLength(mockPerformances.length);
  });

  it("filters classes and performances by studioId", () => {
    const studioId = mockStudios[0].id;
    const result = filterSalaryData({ classes: mockClasses, performances: mockPerformances, packages: mockPackages, studioId });

    expect(result.classes.every((item) => item.studio_id === studioId)).toBe(true);
    expect(result.performances.every((item) => item.studio_id === studioId)).toBe(true);
  });

  it("keeps packages referenced by filtered private classes", () => {
    const studioId = mockStudios[0].id;
    const result = filterSalaryData({ classes: mockClasses, performances: mockPerformances, packages: mockPackages, studioId });
    const referencedPackageIds = result.classes.map((item) => item.package_id).filter(Boolean);

    expect(referencedPackageIds.every((id) => result.packages.some((item) => item.id === id))).toBe(true);
  });
});
