import { describe, expect, it } from "vitest";

import type { Performance, StructuredSalaryRule } from "@/types";

import { calculateCommission } from "./calculateCommission";

const baseRule: Pick<StructuredSalaryRule, "commission_rules" | "commission_mode"> = {
  commission_mode: "tiered",
  commission_rules: [
    { min_amount: 0, max_amount: 10000, rate: 0.03 },
    { min_amount: 10000, max_amount: 30000, rate: 0.05 },
    { min_amount: 30000, max_amount: null, rate: 0.08 }
  ]
};

function performance(amount: number, commissionable = true): Performance {
  return {
    id: `66666666-6666-4666-8666-${String(amount).padStart(12, "0")}`,
    user_id: "11111111-1111-4111-8111-111111111111",
    teacher_id: "22222222-2222-4222-8222-222222222201",
    member_id: null,
    package_id: null,
    date: "2026-06-01",
    customer_name: null,
    type: "private_package",
    amount,
    commissionable,
    note: null,
    created_at: "2026-06-01T00:00:00.000Z"
  };
}

describe("calculateCommission", () => {
  it("calculates tiered commission for 35000 as 1700", () => {
    const result = calculateCommission({ performances: [performance(35000)], salaryRule: baseRule });

    expect(result.performanceTotal).toBe(35000);
    expect(result.commissionTotal).toBe(1700);
    expect(result.commissions).toHaveLength(3);
  });

  it("calculates full_amount_rate commission for 35000 as 2800", () => {
    const result = calculateCommission({
      performances: [performance(35000)],
      salaryRule: {
        ...baseRule,
        commission_mode: "full_amount_rate"
      }
    });

    expect(result.commissionTotal).toBe(2800);
    expect(result.commissions).toHaveLength(1);
  });

  it("excludes non-commissionable performances", () => {
    const result = calculateCommission({
      performances: [performance(35000), performance(10000, false)],
      salaryRule: baseRule
    });

    expect(result.performanceTotal).toBe(35000);
    expect(result.commissionTotal).toBe(1700);
  });

  it("returns warning and zero commission for unknown mode", () => {
    const result = calculateCommission({
      performances: [performance(35000)],
      salaryRule: {
        ...baseRule,
        commission_mode: "unknown"
      }
    });

    expect(result.commissionTotal).toBe(0);
    expect(result.warnings[0]).toBe("业绩提成模式未知，未计算提成。");
  });

  it("returns zero for empty performances", () => {
    const result = calculateCommission({ performances: [], salaryRule: baseRule });

    expect(result.performanceTotal).toBe(0);
    expect(result.commissionTotal).toBe(0);
    expect(result.commissions).toEqual([]);
  });
});
