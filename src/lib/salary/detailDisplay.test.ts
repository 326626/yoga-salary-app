import { describe, expect, it } from "vitest";

import { mockClasses, mockMembers, mockPackages } from "@/lib/mock-data";
import type { PackageItem } from "@/types";

import { describeClassFeeContext, getPrivateClassPackageWarning } from "./detailDisplay";

describe("salary detail display helpers", () => {
  it("describes private class with member package and unit price", () => {
    const classRecord = mockClasses.find((item) => item.package_id === mockPackages[0].id);
    const result = describeClassFeeContext({
      classRecord,
      members: mockMembers,
      packages: mockPackages,
      formula: "300.00 元/节 × 40% × 1 = 120.00 元"
    });

    expect(result).toContain("李女士");
    expect(result).toContain("私教 10 节");
    expect(result).toContain("300.00 元/节");
  });

  it("returns gentle warning when package is missing", () => {
    expect(getPrivateClassPackageWarning(false)).toBe("这节私教课缺少课包，补充课包后工资会更准确～");
  });

  it("describes package item unit price when present", () => {
    const classRecord = {
      ...mockClasses.find((item) => item.package_id === mockPackages[0].id)!,
      package_item_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1"
    };
    const packageItems: PackageItem[] = [{
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      user_id: classRecord.user_id,
      package_id: mockPackages[0].id,
      studio_id: classRecord.studio_id,
      member_id: classRecord.member_id,
      item_name: "理疗私教",
      course_type: "private",
      sessions: 2,
      unit_price: 500,
      total_amount: 1000,
      note: null,
      created_at: classRecord.created_at
    }];
    const result = describeClassFeeContext({
      classRecord,
      members: mockMembers,
      packages: mockPackages,
      packageItems,
      formula: "500.00 元/节 × 40% × 1 = 200.00 元"
    });

    expect(result).toContain("理疗私教");
    expect(result).toContain("500.00 元/节");
  });
});
