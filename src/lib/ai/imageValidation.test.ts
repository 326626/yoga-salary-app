import { describe, expect, it } from "vitest";

import { MAX_SALARY_RULE_IMAGE_SIZE, validateSalaryRuleImageFile } from "./imageValidation";

function file(name: string, type: string, size = 1024) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("validateSalaryRuleImageFile", () => {
  it("accepts jpg png and webp", () => {
    expect(validateSalaryRuleImageFile(file("rule.jpg", "image/jpeg")).ok).toBe(true);
    expect(validateSalaryRuleImageFile(file("rule.png", "image/png")).ok).toBe(true);
    expect(validateSalaryRuleImageFile(file("rule.webp", "image/webp")).ok).toBe(true);
  });

  it("rejects pdf", () => {
    expect(validateSalaryRuleImageFile(file("rule.pdf", "application/pdf")).ok).toBe(false);
  });

  it("rejects files over 5MB", () => {
    expect(validateSalaryRuleImageFile(file("rule.jpg", "image/jpeg", MAX_SALARY_RULE_IMAGE_SIZE + 1)).ok).toBe(false);
  });

  it("rejects missing file", () => {
    expect(validateSalaryRuleImageFile(null)).toEqual({ ok: false, message: "请先选择一张图片～" });
  });
});
