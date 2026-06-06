import { describe, expect, it } from "vitest";

import { mockSalaryRules, mockUserId } from "@/lib/mock-data";
import type { SalaryRule } from "@/types";

import { selectSalaryRule } from "./selectSalaryRule";

const studioId = "99999999-9999-4999-8999-999999999901";

function rule(id: string, studio_id: string | null): SalaryRule {
  return {
    ...mockSalaryRules[0],
    id,
    user_id: mockUserId,
    studio_id,
    name: studio_id ? "专属规则" : "通用规则",
    active: true,
    created_at: "2026-06-01T00:00:00.000Z"
  };
}

describe("selectSalaryRule", () => {
  it("prefers studio specific active rule", () => {
    const result = selectSalaryRule([rule("common", null), rule("studio", studioId)], studioId);

    expect(result.rule?.id).toBe("studio");
  });

  it("falls back to common rule when studio rule is missing", () => {
    const result = selectSalaryRule([rule("common", null)], studioId);

    expect(result.rule?.id).toBe("common");
    expect(result.message).toContain("通用规则");
  });

  it("returns null when no active rule exists", () => {
    const result = selectSalaryRule([{ ...rule("inactive", null), active: false }], studioId);

    expect(result.rule).toBeNull();
  });
});
