import { describe, expect, it } from "vitest";

import type { ClassRecord, MemberPackage } from "@/types";

import { calculatePackageUsageFromClasses } from "./packageUsage";

const memberPackage: Pick<MemberPackage, "id" | "total_sessions"> = {
  id: "44444444-4444-4444-8444-444444444401",
  total_sessions: 10
};

function classRecord(packageId: string | null, hours: number): Pick<ClassRecord, "package_id" | "hours"> {
  return {
    package_id: packageId,
    hours
  };
}

describe("calculatePackageUsageFromClasses", () => {
  it("calculates used and remaining sessions", () => {
    const result = calculatePackageUsageFromClasses(memberPackage, [
      classRecord(memberPackage.id, 1),
      classRecord(memberPackage.id, 1.5),
      classRecord(memberPackage.id, 1.5)
    ]);

    expect(result.usedSessions).toBe(4);
    expect(result.remainingSessions).toBe(6);
    expect(result.isOverused).toBe(false);
  });

  it("returns full remaining sessions when no classes exist", () => {
    const result = calculatePackageUsageFromClasses(memberPackage, []);

    expect(result.usedSessions).toBe(0);
    expect(result.remainingSessions).toBe(10);
  });

  it("handles exactly used up package", () => {
    const result = calculatePackageUsageFromClasses(memberPackage, [classRecord(memberPackage.id, 4), classRecord(memberPackage.id, 6)]);

    expect(result.usedSessions).toBe(10);
    expect(result.remainingSessions).toBe(0);
    expect(result.isOverused).toBe(false);
  });

  it("marks overused packages", () => {
    const result = calculatePackageUsageFromClasses(memberPackage, [classRecord(memberPackage.id, 12)]);

    expect(result.usedSessions).toBe(12);
    expect(result.remainingSessions).toBe(-2);
    expect(result.isOverused).toBe(true);
  });

  it("only counts classes with matching package_id", () => {
    const result = calculatePackageUsageFromClasses(memberPackage, [
      classRecord(memberPackage.id, 3),
      classRecord("44444444-4444-4444-8444-444444444499", 8),
      classRecord(null, 2)
    ]);

    expect(result.usedSessions).toBe(3);
    expect(result.remainingSessions).toBe(7);
  });

  it("supports fractional hours", () => {
    const result = calculatePackageUsageFromClasses(memberPackage, [
      classRecord(memberPackage.id, 0.5),
      classRecord(memberPackage.id, 1.5)
    ]);

    expect(result.usedSessions).toBe(2);
    expect(result.remainingSessions).toBe(8);
  });
});
