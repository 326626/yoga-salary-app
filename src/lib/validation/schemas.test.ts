import { describe, expect, it } from "vitest";

import {
  createClassRecordInputSchema,
  createMemberInputSchema,
  createMemberPackageInputSchema,
  createPerformanceInputSchema,
  settlementInputSchema,
  createStudioInputSchema,
  updateMemberInputSchema,
  updateClassRecordInputSchema,
  updatePerformanceInputSchema,
  memberPackageSchema,
  salaryCalculationSchema,
  salaryRuleSchema,
  structuredSalaryRuleSchema
} from "./schemas";

const validStructuredRule = {
  class_fee_rules: [
    {
      course_type: "group",
      fee_type: "fixed_per_class",
      amount: 100
    },
    {
      course_type: "private",
      fee_type: "percentage_of_unit_price",
      rate: 0.4
    }
  ],
  commission_rules: [
    {
      min_amount: 0,
      max_amount: 10000,
      rate: 0.03
    }
  ],
  commission_mode: "tiered",
  bonus_rules: [],
  deduction_rules: [],
  uncertain_items: []
};

describe("core business schemas", () => {
  it("accepts a valid structured salary rule", () => {
    expect(structuredSalaryRuleSchema.safeParse(validStructuredRule).success).toBe(true);
  });

  it("rejects studio form input without name", () => {
    const result = createStudioInputSchema.safeParse({
      name: "",
      phone: "",
      address: "",
      contact_name: "",
      note: ""
    });

    expect(result.success).toBe(false);
  });

  it("requires studio_id when creating a member", () => {
    const valid = createMemberInputSchema.safeParse({
      studio_id: "99999999-9999-4999-8999-999999999901",
      name: "李女士",
      phone: "",
      note: ""
    });
    const invalid = createMemberInputSchema.safeParse({
      studio_id: "",
      name: "李女士",
      phone: "",
      note: ""
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("allows updating a member studio_id", () => {
    const result = updateMemberInputSchema.safeParse({
      studio_id: "99999999-9999-4999-8999-999999999901",
      name: "李女士",
      phone: "",
      note: ""
    });

    expect(result.success).toBe(true);
  });

  it("accepts studio_id in package class and performance form input", () => {
    const studio_id = "99999999-9999-4999-8999-999999999901";
    expect(createMemberPackageInputSchema.safeParse({
      member_id: "33333333-3333-4333-8333-333333333301",
      teacher_id: "",
      studio_id,
      package_name: "私教 10 节",
      course_type: "private",
      total_amount: "3000",
      total_sessions: "10",
      purchase_date: "2026-06-10",
      note: ""
    }).success).toBe(true);
    expect(createClassRecordInputSchema.safeParse({
      date: "2026-06-10",
      teacher_id: "22222222-2222-4222-8222-222222222201",
      studio_id,
      course_type: "private",
      course_name: "私教课",
      hours: "1",
      student_count: "1",
      member_id: "",
      package_id: "",
      manual_fee: "",
      note: ""
    }).success).toBe(true);
    expect(createPerformanceInputSchema.safeParse({
      date: "2026-06-10",
      teacher_id: "22222222-2222-4222-8222-222222222201",
      studio_id,
      type: "new_card",
      amount: "3000",
      customer_name: "",
      member_id: "",
      package_id: "",
      commissionable: true,
      note: ""
    }).success).toBe(true);
  });

  it("rejects class fee rates greater than 1", () => {
    const result = structuredSalaryRuleSchema.safeParse({
      ...validStructuredRule,
      class_fee_rules: [
        {
          course_type: "private",
          fee_type: "percentage_of_unit_price",
          rate: 1.2
        }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects member packages with non-positive total_sessions", () => {
    const result = memberPackageSchema.safeParse({
      id: "44444444-4444-4444-8444-444444444499",
      user_id: "11111111-1111-4111-8111-111111111111",
      member_id: "33333333-3333-4333-8333-333333333301",
      teacher_id: null,
      package_name: "无效课包",
      course_type: "private",
      total_amount: 1000,
      total_sessions: 0,
      unit_price: 0,
      purchase_date: "2026-06-01",
      note: null,
      created_at: "2026-06-01T00:00:00.000Z"
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid month format", () => {
    const result = salaryCalculationSchema.safeParse({
      id: "88888888-8888-4888-8888-888888888899",
      user_id: "11111111-1111-4111-8111-111111111111",
      teacher_id: "22222222-2222-4222-8222-222222222201",
      month: "2026/06",
      class_fee_total: 0,
      performance_total: 0,
      commission_total: 0,
      bonus_total: 0,
      deduction_total: 0,
      salary_total: 0,
      breakdown: {
        classFees: [],
        commissions: [],
        warnings: []
      },
      status: "unsettled",
      actual_paid_amount: null,
      settled_at: null,
      note: null,
      created_at: "2026-06-01T00:00:00.000Z",
      updated_at: "2026-06-01T00:00:00.000Z"
    });

    expect(result.success).toBe(false);
  });

  it("accepts settled input with nonnegative actual paid amount", () => {
    const result = settlementInputSchema.safeParse({
      status: "settled",
      actual_paid_amount: "6800",
      settled_at: "2026-06-30",
      note: "已到账"
    });

    expect(result.success).toBe(true);
  });

  it("rejects settlement input with negative actual paid amount", () => {
    const result = settlementInputSchema.safeParse({
      status: "settled",
      actual_paid_amount: "-1",
      settled_at: "2026-06-30",
      note: ""
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid settlement status", () => {
    const result = settlementInputSchema.safeParse({
      status: "paid",
      actual_paid_amount: "100",
      settled_at: "2026-06-30",
      note: ""
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid salary rule source_type", () => {
    const result = salaryRuleSchema.safeParse({
      id: "77777777-7777-4777-8777-777777777799",
      user_id: "11111111-1111-4111-8111-111111111111",
      teacher_id: null,
      name: "无效来源规则",
      raw_text: "手动规则",
      structured_rule: validStructuredRule,
      source_type: "deepseek",
      active: false,
      created_at: "2026-06-01T00:00:00.000Z"
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid class record form input", () => {
    const result = createClassRecordInputSchema.safeParse({
      date: "2026-06-10",
      teacher_id: "22222222-2222-4222-8222-222222222201",
      course_type: "private",
      course_name: "私教体态调整",
      hours: "1",
      student_count: "1",
      member_id: "33333333-3333-4333-8333-333333333301",
      package_id: "44444444-4444-4444-8444-444444444401",
      manual_fee: "",
      note: ""
    });

    expect(result.success).toBe(true);
  });

  it("rejects class record form input with non-positive hours", () => {
    const result = createClassRecordInputSchema.safeParse({
      date: "2026-06-10",
      teacher_id: "22222222-2222-4222-8222-222222222201",
      course_type: "group",
      course_name: "晨间流瑜伽",
      hours: "0",
      student_count: "8",
      member_id: "",
      package_id: "",
      manual_fee: "",
      note: ""
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid performance form input", () => {
    const result = createPerformanceInputSchema.safeParse({
      date: "2026-06-10",
      teacher_id: "22222222-2222-4222-8222-222222222201",
      type: "new_card",
      amount: "3000",
      customer_name: "李女士",
      member_id: "",
      package_id: "",
      commissionable: true,
      note: ""
    });

    expect(result.success).toBe(true);
  });

  it("rejects performance form input with negative amount", () => {
    const result = createPerformanceInputSchema.safeParse({
      date: "2026-06-10",
      teacher_id: "22222222-2222-4222-8222-222222222201",
      type: "new_card",
      amount: "-1",
      customer_name: "李女士",
      member_id: "",
      package_id: "",
      commissionable: true,
      note: ""
    });

    expect(result.success).toBe(false);
  });

  it("rejects class update input with non-positive hours", () => {
    const result = updateClassRecordInputSchema.safeParse({
      date: "2026-06-10",
      teacher_id: "22222222-2222-4222-8222-222222222201",
      studio_id: "",
      course_type: "group",
      course_name: "晨间流瑜伽",
      hours: "0",
      student_count: "8",
      member_id: "",
      package_id: "",
      manual_fee: "",
      note: ""
    });

    expect(result.success).toBe(false);
  });

  it("rejects performance update input with negative amount", () => {
    const result = updatePerformanceInputSchema.safeParse({
      date: "2026-06-10",
      teacher_id: "22222222-2222-4222-8222-222222222201",
      studio_id: "",
      type: "new_card",
      amount: "-1",
      customer_name: "",
      member_id: "",
      package_id: "",
      commissionable: true,
      note: ""
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid member package form input", () => {
    const result = createMemberPackageInputSchema.safeParse({
      member_id: "33333333-3333-4333-8333-333333333301",
      teacher_id: "",
      studio_id: "99999999-9999-4999-8999-999999999901",
      package_name: "私教 10 节",
      course_type: "private",
      total_amount: "3000",
      total_sessions: "10",
      purchase_date: "2026-06-10",
      note: ""
    });

    expect(result.success).toBe(true);
  });

  it("accepts package input by unit price", () => {
    const result = createMemberPackageInputSchema.safeParse({
      member_id: "33333333-3333-4333-8333-333333333301",
      teacher_id: "",
      studio_id: "99999999-9999-4999-8999-999999999901",
      pricing_mode: "unit_price",
      package_name: "私教 10 节",
      course_type: "private",
      unit_price: "300",
      total_sessions: "10",
      purchase_date: "2026-06-10",
      note: ""
    });

    expect(result.success).toBe(true);
  });

  it("rejects package form input with non-positive total sessions", () => {
    const result = createMemberPackageInputSchema.safeParse({
      member_id: "33333333-3333-4333-8333-333333333301",
      teacher_id: "",
      studio_id: "99999999-9999-4999-8999-999999999901",
      package_name: "私教 10 节",
      course_type: "private",
      total_amount: "3000",
      total_sessions: "0",
      purchase_date: "2026-06-10",
      note: ""
    });

    expect(result.success).toBe(false);
  });

  it("rejects package form input without member", () => {
    const result = createMemberPackageInputSchema.safeParse({
      member_id: "",
      teacher_id: "",
      studio_id: "99999999-9999-4999-8999-999999999901",
      package_name: "私教 10 节",
      course_type: "private",
      total_amount: "3000",
      total_sessions: "10",
      purchase_date: "2026-06-10",
      note: ""
    });

    expect(result.success).toBe(false);
  });
});
