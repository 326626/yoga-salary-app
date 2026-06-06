import { describe, expect, it } from "vitest";

import { mockClasses, mockMembers, mockPackages } from "@/lib/mock-data";

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
});
