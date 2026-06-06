import { describe, expect, it } from "vitest";

import { buildOveruseWarning, getPackageUsageLabel } from "./usageDisplay";

describe("package usage display helpers", () => {
  it("shows remaining sessions", () => {
    expect(getPackageUsageLabel({ remainingSessions: 6 })).toBe("还剩 6 节");
  });

  it("shows used up label", () => {
    expect(getPackageUsageLabel({ remainingSessions: 0 })).toBe("已上完");
  });

  it("shows overused label", () => {
    expect(getPackageUsageLabel({ remainingSessions: -1 })).toBe("已超 1 节");
  });

  it("builds warning when hours exceed remaining sessions", () => {
    expect(buildOveruseWarning(2, 1)).toBe("本次记录 2 节，但课包只剩 1 节，保存后会超出课包课时～");
  });
});
