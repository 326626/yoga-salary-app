import { describe, expect, it } from "vitest";

import { isValidChinaPhone, normalizeChinaPhone, toSupabasePhone } from "./phone";

describe("China phone helpers", () => {
  it.each([
    ["13800138000", "+8613800138000"],
    ["+8613800138000", "+8613800138000"],
    ["86 13800138000", "+8613800138000"],
    ["138 0013 8000", "+8613800138000"],
    ["138-0013-8000", "+8613800138000"]
  ])("normalizes %s", (input, expected) => {
    expect(normalizeChinaPhone(input)).toBe(expected);
    expect(toSupabasePhone(input)).toBe(expected);
  });

  it("accepts valid China mobile phone numbers", () => {
    expect(isValidChinaPhone("13800138000")).toBe(true);
  });

  it("rejects non-11-digit phone numbers", () => {
    expect(isValidChinaPhone("1380013800")).toBe(false);
  });

  it("rejects phone numbers whose second digit is not 3-9", () => {
    expect(isValidChinaPhone("12800138000")).toBe(false);
  });

  it("rejects nonnumeric phone numbers", () => {
    expect(isValidChinaPhone("13800abc000")).toBe(false);
  });
});
