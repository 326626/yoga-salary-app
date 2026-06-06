import { describe, expect, it } from "vitest";

import {
  activeMockSalaryRule,
  mockClasses,
  mockPackages,
  mockSalaryRules
} from "./mock-data";
import { structuredSalaryRuleSchema } from "./validation";

describe("mock data", () => {
  it("keeps package unit_price equal to total_amount / total_sessions", () => {
    for (const memberPackage of mockPackages) {
      expect(memberPackage.unit_price).toBeCloseTo(memberPackage.total_amount / memberPackage.total_sessions, 8);
    }
  });

  it("includes at least one private class missing package_id for warning tests", () => {
    expect(
      mockClasses.some((classRecord) => classRecord.course_type === "private" && classRecord.package_id === null)
    ).toBe(true);
  });

  it("includes an active salary rule", () => {
    expect(activeMockSalaryRule).toBeDefined();
    expect(mockSalaryRules.some((rule) => rule.active)).toBe(true);
  });

  it("keeps the active salary rule compatible with structuredSalaryRuleSchema", () => {
    expect(activeMockSalaryRule).toBeDefined();
    expect(structuredSalaryRuleSchema.safeParse(activeMockSalaryRule?.structured_rule).success).toBe(true);
  });

  it("includes private packages with different unit prices", () => {
    const privateUnitPrices = new Set(
      mockPackages.filter((memberPackage) => memberPackage.course_type === "private").map((memberPackage) => memberPackage.unit_price)
    );

    expect(privateUnitPrices.size).toBeGreaterThanOrEqual(2);
    expect(privateUnitPrices.has(300)).toBe(true);
    expect(privateUnitPrices.has(500)).toBe(true);
  });
});
