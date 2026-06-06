import { describe, expect, it } from "vitest";

import { getMemberDeletePrompt, getPackageDeletePrompt, getTeacherDeletePrompt } from "./relationPrompts";

describe("delete relation prompts", () => {
  it("returns stronger member prompt when relations exist", () => {
    expect(getMemberDeletePrompt({ packages: 1 })).toContain("还有课包或记录");
  });

  it("returns normal member prompt without relations", () => {
    expect(getMemberDeletePrompt({ packages: 0, classes: 0, performances: 0 })).toBe("确定删除这位会员吗？");
  });

  it("returns stronger package prompt when relations exist", () => {
    expect(getPackageDeletePrompt({ classes: 1 })).toContain("已有课程或业绩记录");
  });

  it("returns stronger teacher prompt when relations exist", () => {
    expect(getTeacherDeletePrompt({ salaryRules: 1 })).toContain("已有相关记录");
  });
});
