import { describe, expect, it } from "vitest";

import { buildCreateClassRecordPayload, buildUpdateClassRecordPayload, deleteClassRecord } from "./classes";
import { buildCreateMemberPayload, buildUpdateMemberPayload } from "./members";
import { buildCreateMemberPackagePayload, buildUpdateMemberPackagePayload } from "./packages";
import { buildCreatePerformancePayload, buildUpdatePerformancePayload, deletePerformance } from "./performances";
import { buildCreateSalaryCalculationPayload, buildUpdateSalaryCalculationPayload, deleteSalaryCalculation, findSalaryCalculationByMonthAndStudio } from "./salaryCalculations";
import { buildCreateSalaryRulePayload } from "./salaryRules";
import { buildCreateStudioPayload, buildUpdateStudioPayload } from "./studios";
import { buildCreateTeacherPayload, buildUpdateTeacherPayload } from "./teachers";

const trustedUserId = "11111111-1111-4111-8111-111111111111";
const maliciousUserId = "99999999-9999-4999-8999-999999999999";

describe("data helper payload builders", () => {
  it("forces class record user_id to current user", () => {
    const payload = buildCreateClassRecordPayload(
      {
        user_id: maliciousUserId,
        date: "2026-06-10",
        teacher_id: "22222222-2222-4222-8222-222222222201",
        course_type: "group",
        course_name: "晨间流瑜伽",
        hours: 1,
        student_count: 8,
        member_id: "",
        package_id: "",
        note: ""
      },
      trustedUserId
    );

    expect(payload.user_id).toBe(trustedUserId);
  });

  it("forces performance user_id to current user", () => {
    const payload = buildCreatePerformancePayload(
      {
        user_id: maliciousUserId,
        date: "2026-06-10",
        teacher_id: "22222222-2222-4222-8222-222222222201",
        type: "new_card",
        amount: 3000,
        customer_name: "李女士",
        member_id: "",
        package_id: "",
        commissionable: true,
        note: ""
      },
      trustedUserId
    );

    expect(payload.user_id).toBe(trustedUserId);
  });

  it("class update payload does not contain user_id", () => {
    const payload = buildUpdateClassRecordPayload({
      user_id: maliciousUserId,
      date: "2026-06-10",
      teacher_id: "22222222-2222-4222-8222-222222222201",
      studio_id: "99999999-9999-4999-8999-999999999901",
      course_type: "group",
      course_name: "晨间流瑜伽",
      hours: 1,
      student_count: 8,
      member_id: "",
      package_id: "",
      note: ""
    });

    expect(payload).not.toHaveProperty("user_id");
  });

  it("performance update payload does not contain user_id", () => {
    const payload = buildUpdatePerformancePayload({
      user_id: maliciousUserId,
      date: "2026-06-10",
      teacher_id: "22222222-2222-4222-8222-222222222201",
      studio_id: "99999999-9999-4999-8999-999999999901",
      type: "new_card",
      amount: 3000,
      customer_name: "李女士",
      member_id: "",
      package_id: "",
      commissionable: true,
      note: ""
    });

    expect(payload).not.toHaveProperty("user_id");
  });

  it("delete helpers constrain by user_id", async () => {
    const eqCalls: Array<[string, string]> = [];
    const supabase = {
      from() {
        return {
          delete() {
            return {
              eq(column: string, value: string) {
                eqCalls.push([column, value]);
                return this;
              },
              error: null
            };
          }
        };
      }
    };

    await deleteClassRecord(supabase as never, trustedUserId, "class-id");
    await deletePerformance(supabase as never, trustedUserId, "performance-id");
    await deleteSalaryCalculation(supabase as never, trustedUserId, "salary-calculation-id");

    expect(eqCalls).toContainEqual(["user_id", trustedUserId]);
    expect(eqCalls.filter(([column]) => column === "user_id")).toHaveLength(3);
  });

  it("forces salary rule user_id to current user", () => {
    const payload = buildCreateSalaryRulePayload(
      {
        user_id: maliciousUserId,
        name: "规则",
        raw_text: "团课 100",
        structured_rule: {
          class_fee_rules: [],
          commission_rules: [],
          commission_mode: "unknown",
          bonus_rules: [],
          deduction_rules: [],
          uncertain_items: []
        },
        source_type: "manual",
        active: true
      },
      trustedUserId
    );

    expect(payload.user_id).toBe(trustedUserId);
  });

  it("keeps salary rule studio_id while forcing user_id", () => {
    const payload = buildCreateSalaryRulePayload(
      {
        user_id: maliciousUserId,
        studio_id: "99999999-9999-4999-8999-999999999901",
        name: "规则",
        raw_text: "团课 100",
        structured_rule: {
          class_fee_rules: [],
          commission_rules: [],
          commission_mode: "unknown",
          bonus_rules: [],
          deduction_rules: [],
          uncertain_items: []
        }
      },
      trustedUserId
    );

    expect(payload.user_id).toBe(trustedUserId);
    expect(payload.studio_id).toBe("99999999-9999-4999-8999-999999999901");
  });

  it("forces salary calculation user_id to current user", () => {
    const payload = buildCreateSalaryCalculationPayload(
      {
        user_id: maliciousUserId,
        teacher_id: "22222222-2222-4222-8222-222222222201",
        studio_id: "99999999-9999-4999-8999-999999999901",
        month: "2026-06",
        class_fee_total: 100,
        performance_total: 3000,
        commission_total: 90,
        bonus_total: 0,
        deduction_total: 0,
        salary_total: 190,
        breakdown: { classFees: [], commissions: [], warnings: [] },
        status: "unsettled",
        actual_paid_amount: null,
        settled_at: null,
        note: ""
      },
      trustedUserId
    );

    expect(payload.user_id).toBe(trustedUserId);
    expect(payload.studio_id).toBe("99999999-9999-4999-8999-999999999901");
  });

  it("salary calculation update payload does not contain user_id", () => {
    const payload = buildUpdateSalaryCalculationPayload({
      user_id: maliciousUserId,
      salary_total: 200,
      status: "settled",
      actual_paid_amount: 200,
      settled_at: "2026-06-30",
      note: "已到账"
    });

    expect(payload).not.toHaveProperty("user_id");
  });

  it("finds salary calculation by month and null studio", async () => {
    const calls: Array<[string, string | null]> = [];
    const supabase = {
      from() {
        return {
          select() {
            return this;
          },
          eq(column: string, value: string) {
            calls.push([column, value]);
            return this;
          },
          is(column: string, value: null) {
            calls.push([column, value]);
            return this;
          },
          order() {
            return this;
          },
          limit() {
            return this;
          },
          maybeSingle() {
            return { data: null, error: null };
          }
        };
      }
    };

    await findSalaryCalculationByMonthAndStudio(supabase as never, trustedUserId, "2026-06", null);
    expect(calls).toContainEqual(["user_id", trustedUserId]);
    expect(calls).toContainEqual(["month", "2026-06"]);
    expect(calls).toContainEqual(["studio_id", null]);
  });

  it("finds salary calculation by month and specific studio", async () => {
    const calls: Array<[string, string]> = [];
    const supabase = {
      from() {
        return {
          select() {
            return this;
          },
          eq(column: string, value: string) {
            calls.push([column, value]);
            return this;
          },
          order() {
            return this;
          },
          limit() {
            return this;
          },
          maybeSingle() {
            return { data: null, error: null };
          }
        };
      }
    };

    await findSalaryCalculationByMonthAndStudio(supabase as never, trustedUserId, "2026-06", "99999999-9999-4999-8999-999999999901");
    expect(calls).toContainEqual(["user_id", trustedUserId]);
    expect(calls).toContainEqual(["month", "2026-06"]);
    expect(calls).toContainEqual(["studio_id", "99999999-9999-4999-8999-999999999901"]);
  });

  it("forces teacher user_id to current user", () => {
    const payload = buildCreateTeacherPayload(
      {
        user_id: maliciousUserId,
        name: "张老师",
        phone: "",
        note: ""
      },
      trustedUserId
    );

    expect(payload.user_id).toBe(trustedUserId);
  });

  it("teacher update payload does not contain user_id", () => {
    const payload = buildUpdateTeacherPayload({
      user_id: maliciousUserId,
      name: "张老师",
      phone: "",
      note: ""
    });

    expect(payload).not.toHaveProperty("user_id");
  });

  it("forces member user_id to current user", () => {
    const payload = buildCreateMemberPayload(
      {
        user_id: maliciousUserId,
        studio_id: "99999999-9999-4999-8999-999999999901",
        name: "李女士",
        phone: "",
        note: ""
      },
      trustedUserId
    );

    expect(payload.user_id).toBe(trustedUserId);
    expect(payload.studio_id).toBe("99999999-9999-4999-8999-999999999901");
  });

  it("member update payload does not contain user_id", () => {
    const payload = buildUpdateMemberPayload({
      user_id: maliciousUserId,
      studio_id: "99999999-9999-4999-8999-999999999901",
      name: "李女士",
      phone: "",
      note: ""
    });

    expect(payload).not.toHaveProperty("user_id");
    expect(payload.studio_id).toBe("99999999-9999-4999-8999-999999999901");
  });

  it("forces package user_id and calculates unit_price", () => {
    const payload = buildCreateMemberPackagePayload(
      {
        user_id: maliciousUserId,
        unit_price: 1,
        studio_id: "99999999-9999-4999-8999-999999999901",
        member_id: "33333333-3333-4333-8333-333333333301",
        teacher_id: "22222222-2222-4222-8222-222222222201",
        package_name: "私教 10 节",
        course_type: "private",
        total_amount: 3000,
        total_sessions: 10,
        purchase_date: "2026-06-10",
        note: ""
      },
      trustedUserId
    );

    expect(payload.user_id).toBe(trustedUserId);
    expect(payload.unit_price).toBe(300);
    expect(payload.studio_id).toBe("99999999-9999-4999-8999-999999999901");
  });

  it("package payload accepts unit price mode and does not require teacher_id", () => {
    const payload = buildCreateMemberPackagePayload(
      {
        user_id: maliciousUserId,
        pricing_mode: "unit_price",
        studio_id: "99999999-9999-4999-8999-999999999901",
        member_id: "33333333-3333-4333-8333-333333333301",
        package_name: "私教 10 节",
        course_type: "private",
        unit_price: 300,
        total_sessions: 10,
        purchase_date: "2026-06-10",
        note: ""
      },
      trustedUserId
    );

    expect(payload.user_id).toBe(trustedUserId);
    expect(payload.teacher_id).toBeNull();
    expect(payload.total_amount).toBe(3000);
    expect(payload.unit_price).toBe(300);
  });

  it("package update payload does not contain user_id and recalculates unit_price", () => {
    const payload = buildUpdateMemberPackagePayload({
      user_id: maliciousUserId,
      unit_price: 1,
      member_id: "33333333-3333-4333-8333-333333333301",
      teacher_id: "",
      package_name: "私教 8 节",
      course_type: "private",
      total_amount: 2400,
      total_sessions: 8,
      purchase_date: "2026-06-10",
      note: ""
    });

    expect(payload).not.toHaveProperty("user_id");
    expect(payload.unit_price).toBe(300);
  });

  it("forces studio user_id to current user", () => {
    const payload = buildCreateStudioPayload(
      {
        user_id: maliciousUserId,
        name: "禅悦瑜伽馆",
        phone: "",
        address: "",
        contact_name: "",
        note: ""
      },
      trustedUserId
    );

    expect(payload.user_id).toBe(trustedUserId);
  });

  it("studio update payload does not contain user_id", () => {
    const payload = buildUpdateStudioPayload({
      user_id: maliciousUserId,
      name: "禅悦瑜伽馆",
      phone: "",
      address: "",
      contact_name: "",
      note: ""
    });

    expect(payload).not.toHaveProperty("user_id");
  });
});
