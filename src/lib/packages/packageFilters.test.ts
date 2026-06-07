import { describe, expect, it } from "vitest";

import { mockPackages, mockStudios } from "@/lib/mock-data";

import { filterPackagesByStudioAndMember, getPackageFilterEmptyMessage } from "./packageFilters";

describe("package filters", () => {
  it("returns all packages with default filters", () => {
    expect(filterPackagesByStudioAndMember(mockPackages, "all", "")).toHaveLength(mockPackages.length);
  });

  it("filters by studio", () => {
    const result = filterPackagesByStudioAndMember(mockPackages, mockStudios[0].id, "");

    expect(result.every((item) => item.studio_id === mockStudios[0].id)).toBe(true);
  });

  it("filters by member", () => {
    const result = filterPackagesByStudioAndMember(mockPackages, "all", mockPackages[0].member_id);

    expect(result.every((item) => item.member_id === mockPackages[0].member_id)).toBe(true);
  });

  it("filters by studio and member together", () => {
    const result = filterPackagesByStudioAndMember(mockPackages, mockPackages[0].studio_id ?? "", mockPackages[0].member_id);

    expect(result.every((item) => item.studio_id === mockPackages[0].studio_id && item.member_id === mockPackages[0].member_id)).toBe(true);
  });

  it("returns friendly empty messages", () => {
    expect(getPackageFilterEmptyMessage(mockStudios[0].id, "")).toBe("这个瑜伽馆还没有课包～");
    expect(getPackageFilterEmptyMessage("all", mockPackages[0].member_id)).toBe("这个会员还没有课包～");
  });
});
