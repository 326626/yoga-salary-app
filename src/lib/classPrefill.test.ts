import { describe, expect, it } from "vitest";

import { mockPackages } from "@/lib/mock-data";

import { applyClassQueryPrefill, derivePackageSelection, filterPackagesForMember } from "./classPrefill";

const baseForm = {
  member_id: "",
  package_id: "",
  teacher_id: "",
  course_type: "group",
  course_name: ""
};

describe("class prefill helpers", () => {
  it("applies memberId packageId and private courseType defaults", () => {
    const result = applyClassQueryPrefill(
      baseForm,
      {
        memberId: mockPackages[0].member_id,
        packageId: mockPackages[0].id,
        courseType: "private"
      },
      mockPackages
    );

    expect(result.member_id).toBe(mockPackages[0].member_id);
    expect(result.package_id).toBe(mockPackages[0].id);
    expect(result.course_type).toBe("private");
    expect(result.course_name).toBe("私教课");
  });

  it("ignores invalid courseType", () => {
    const result = applyClassQueryPrefill(baseForm, { courseType: "bad-type" }, mockPackages);

    expect(result.course_type).toBe("group");
  });

  it("does not allow query user_id into form values", () => {
    const result = applyClassQueryPrefill(baseForm, { user_id: "99999999-9999-4999-8999-999999999999" }, mockPackages);

    expect(result).not.toHaveProperty("user_id");
  });

  it("derives member and teacher from selected package", () => {
    const result = derivePackageSelection({
      packageId: mockPackages[0].id,
      packages: mockPackages,
      currentTeacherId: "",
      teacherTouched: false
    });

    expect(result.member_id).toBe(mockPackages[0].member_id);
    expect(result.teacher_id).toBe(mockPackages[0].teacher_id);
  });

  it("keeps manually selected teacher when package is selected", () => {
    const result = derivePackageSelection({
      packageId: mockPackages[0].id,
      packages: mockPackages,
      currentTeacherId: "22222222-2222-4222-8222-222222222202",
      teacherTouched: true
    });

    expect(result.member_id).toBe(mockPackages[0].member_id);
    expect(result.teacher_id).toBe("22222222-2222-4222-8222-222222222202");
  });

  it("filters packages by member", () => {
    const result = filterPackagesForMember(mockPackages, mockPackages[0].member_id);

    expect(result.every((item) => item.member_id === mockPackages[0].member_id)).toBe(true);
  });
});
