import { describe, expect, it } from "vitest";

import type { ClassRecord, MemberPackage, PackageItem } from "@/types";

import { calculatePackageItemUsage, calculatePackageUsageFromClasses } from "./packageUsage";

const memberPackage: Pick<MemberPackage, "id" | "total_sessions"> = {
  id: "44444444-4444-4444-8444-444444444401",
  total_sessions: 10
};

function classRecord(packageId: string | null, hours: number, packageItemId?: string | null): Pick<ClassRecord, "package_id" | "package_item_id" | "hours"> {
  return {
    package_id: packageId,
    package_item_id: packageItemId,
    hours
  };
}

const packageItems: PackageItem[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    user_id: "11111111-1111-4111-8111-111111111111",
    package_id: memberPackage.id,
    studio_id: null,
    member_id: null,
    item_name: "私教",
    course_type: "private",
    sessions: 8,
    unit_price: 300,
    total_amount: 2400,
    note: null,
    created_at: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    user_id: "11111111-1111-4111-8111-111111111111",
    package_id: memberPackage.id,
    studio_id: null,
    member_id: null,
    item_name: "理疗",
    course_type: "private",
    sessions: 2,
    unit_price: 500,
    total_amount: 1000,
    note: null,
    created_at: "2026-06-01T00:00:00.000Z"
  }
];

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

  it("calculates package total usage from package items", () => {
    const result = calculatePackageUsageFromClasses(memberPackage, [
      classRecord(memberPackage.id, 1, packageItems[0].id),
      classRecord(memberPackage.id, 0.5, packageItems[1].id)
    ], packageItems);

    expect(result.totalSessions).toBe(10);
    expect(result.usedSessions).toBe(1.5);
    expect(result.remainingSessions).toBe(8.5);
    expect(result.itemUsages?.[0].remainingSessions).toBe(7);
  });

  it("calculates usage for a single package item", () => {
    const result = calculatePackageItemUsage(packageItems[1], [
      classRecord(memberPackage.id, 1, packageItems[0].id),
      classRecord(memberPackage.id, 1.5, packageItems[1].id)
    ]);

    expect(result.itemName).toBe("理疗");
    expect(result.usedSessions).toBe(1.5);
    expect(result.remainingSessions).toBe(0.5);
  });
});
