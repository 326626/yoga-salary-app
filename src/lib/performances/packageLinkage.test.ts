import { describe, expect, it } from "vitest";

import { mockMembers, mockPackages } from "@/lib/mock-data";

import { derivePerformancePackageSelection } from "./packageLinkage";

const baseForm = {
  member_id: "",
  studio_id: "",
  amount: "",
  customer_name: ""
};

describe("performance package linkage", () => {
  it("derives member_id from selected package", () => {
    const result = derivePerformancePackageSelection({ packageId: mockPackages[0].id, packages: mockPackages, members: mockMembers, currentForm: baseForm });

    expect(result.member_id).toBe(mockPackages[0].member_id);
  });

  it("derives studio_id from selected package", () => {
    const result = derivePerformancePackageSelection({ packageId: mockPackages[0].id, packages: mockPackages, members: mockMembers, currentForm: baseForm });

    expect(result.studio_id).toBe(mockPackages[0].studio_id);
  });

  it("defaults amount to package total_amount", () => {
    const result = derivePerformancePackageSelection({ packageId: mockPackages[0].id, packages: mockPackages, members: mockMembers, currentForm: baseForm });

    expect(result.amount).toBe(String(mockPackages[0].total_amount));
  });

  it("does not overwrite manually entered amount", () => {
    const result = derivePerformancePackageSelection({
      packageId: mockPackages[0].id,
      packages: mockPackages,
      members: mockMembers,
      currentForm: { ...baseForm, amount: "2888" },
      amountTouched: true
    });

    expect(result.amount).toBe("2888");
  });
});
