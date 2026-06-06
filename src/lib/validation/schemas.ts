import { z } from "zod";

export const courseTypeSchema = z.enum(["group", "private", "trial", "substitute", "other"]);

export const performanceTypeSchema = z.enum(["new_card", "renewal", "private_package", "product", "other"]);

export const salaryRuleSourceTypeSchema = z.enum(["manual", "image_ai"]);
export const salaryCalculationStatusSchema = z.enum(["unsettled", "settled"]);

const idSchema = z.string().uuid();
const nullableTextSchema = z.string().nullable();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期必须使用 YYYY-MM-DD 格式");
const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, "月份必须使用 YYYY-MM 格式");
const createdAtSchema = z.string().min(1);
const optionalIdSchema = z.string().uuid().or(z.literal("")).optional();
const optionalNumberFromFormSchema = z.preprocess(
  (value) => (value === "" || value === null || typeof value === "undefined" ? undefined : Number(value)),
  z.number().nonnegative().optional()
);
const positiveNumberFromFormSchema = z.preprocess(
  (value) => (value === "" || value === null || typeof value === "undefined" ? undefined : Number(value)),
  z.number().positive()
);
const nonnegativeNumberFromFormSchema = z.preprocess(
  (value) => (value === "" || value === null || typeof value === "undefined" ? undefined : Number(value)),
  z.number().nonnegative()
);

export const teacherSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  name: z.string().trim().min(1),
  phone: nullableTextSchema,
  note: nullableTextSchema,
  created_at: createdAtSchema
});

export const studioSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  name: z.string().trim().min(1),
  phone: nullableTextSchema,
  address: nullableTextSchema,
  contact_name: nullableTextSchema,
  note: nullableTextSchema,
  created_at: createdAtSchema
});

export const memberSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  name: z.string().trim().min(1),
  phone: nullableTextSchema,
  note: nullableTextSchema,
  created_at: createdAtSchema
});

export const memberPackageSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  member_id: idSchema,
  teacher_id: idSchema.nullable(),
  studio_id: idSchema.nullable(),
  package_name: z.string().trim().min(1),
  course_type: courseTypeSchema,
  total_amount: z.number().nonnegative(),
  total_sessions: z.number().positive(),
  unit_price: z.number().nonnegative(),
  purchase_date: dateSchema,
  note: nullableTextSchema,
  created_at: createdAtSchema
});

export const classRecordSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  teacher_id: idSchema,
  studio_id: idSchema.nullable(),
  member_id: idSchema.nullable(),
  package_id: idSchema.nullable(),
  date: dateSchema,
  course_name: z.string().trim().min(1),
  course_type: courseTypeSchema,
  student_count: z.number().int().nonnegative(),
  hours: z.number().positive(),
  manual_fee: z.number().nonnegative().nullable(),
  note: nullableTextSchema,
  created_at: createdAtSchema
});

export const performanceSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  teacher_id: idSchema,
  studio_id: idSchema.nullable(),
  member_id: idSchema.nullable(),
  package_id: idSchema.nullable(),
  date: dateSchema,
  customer_name: nullableTextSchema,
  type: performanceTypeSchema,
  amount: z.number().nonnegative(),
  commissionable: z.boolean(),
  note: nullableTextSchema,
  created_at: createdAtSchema
});

const fixedClassFeeRuleSchema = z.object({
  course_type: courseTypeSchema,
  fee_type: z.literal("fixed_per_class"),
  amount: z.number().nonnegative()
});

const fixedHourlyFeeRuleSchema = z.object({
  course_type: courseTypeSchema,
  fee_type: z.literal("fixed_per_hour"),
  amount: z.number().nonnegative()
});

const percentageUnitPriceRuleSchema = z.object({
  course_type: courseTypeSchema,
  fee_type: z.literal("percentage_of_unit_price"),
  rate: z.number().min(0).max(1)
});

const noClassFeeRuleSchema = z.object({
  course_type: courseTypeSchema,
  fee_type: z.literal("none"),
  amount: z.literal(0)
});

export const classFeeRuleSchema = z.discriminatedUnion("fee_type", [
  fixedClassFeeRuleSchema,
  fixedHourlyFeeRuleSchema,
  percentageUnitPriceRuleSchema,
  noClassFeeRuleSchema
]);

export const commissionRuleSchema = z
  .object({
    min_amount: z.number().nonnegative(),
    max_amount: z.number().positive().nullable(),
    rate: z.number().min(0).max(1)
  })
  .refine((rule) => rule.max_amount === null || rule.max_amount > rule.min_amount, {
    message: "max_amount 必须大于 min_amount"
  });

export const structuredSalaryRuleSchema = z.object({
  class_fee_rules: z.array(classFeeRuleSchema),
  commission_rules: z.array(commissionRuleSchema),
  commission_mode: z.enum(["tiered", "full_amount_rate", "unknown"]),
  bonus_rules: z.array(z.unknown()),
  deduction_rules: z.array(z.unknown()),
  uncertain_items: z.array(z.string())
});

export const salaryRuleSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  teacher_id: idSchema.nullable(),
  studio_id: idSchema.nullable(),
  name: z.string().trim().min(1),
  raw_text: z.string().trim().min(1),
  structured_rule: structuredSalaryRuleSchema,
  source_type: salaryRuleSourceTypeSchema,
  active: z.boolean(),
  created_at: createdAtSchema
});

export const salaryCalculationSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  teacher_id: idSchema,
  studio_id: idSchema.nullable(),
  month: monthSchema,
  class_fee_total: z.number().nonnegative(),
  performance_total: z.number().nonnegative(),
  commission_total: z.number().nonnegative(),
  bonus_total: z.number().nonnegative(),
  deduction_total: z.number().nonnegative(),
  salary_total: z.number().nonnegative(),
  breakdown: z.object({
    classFees: z.array(z.unknown()),
    commissions: z.array(z.unknown()),
    warnings: z.array(z.string())
  }),
  status: salaryCalculationStatusSchema,
  actual_paid_amount: z.number().nonnegative().nullable(),
  settled_at: dateSchema.nullable(),
  note: nullableTextSchema,
  created_at: createdAtSchema,
  updated_at: createdAtSchema
});

export const createSalaryCalculationInputSchema = z.object({
  teacher_id: idSchema,
  studio_id: optionalIdSchema,
  month: monthSchema,
  class_fee_total: z.number().nonnegative(),
  performance_total: z.number().nonnegative(),
  commission_total: z.number().nonnegative(),
  bonus_total: z.number().nonnegative(),
  deduction_total: z.number().nonnegative(),
  salary_total: z.number().nonnegative(),
  breakdown: z.object({
    classFees: z.array(z.unknown()),
    commissions: z.array(z.unknown()),
    warnings: z.array(z.string())
  }),
  status: salaryCalculationStatusSchema.default("unsettled"),
  actual_paid_amount: z.number().nonnegative().nullable().optional(),
  settled_at: dateSchema.nullable().optional(),
  note: z.string().optional()
});

export const updateSalaryCalculationInputSchema = createSalaryCalculationInputSchema.partial().extend({
  status: salaryCalculationStatusSchema.optional(),
  actual_paid_amount: z.number().nonnegative().nullable().optional(),
  settled_at: dateSchema.nullable().optional(),
  note: z.string().optional()
});

export const settlementInputSchema = z.object({
  status: salaryCalculationStatusSchema,
  actual_paid_amount: z.preprocess(
    (value) => (value === "" || value === null || typeof value === "undefined" ? null : Number(value)),
    z.number().nonnegative().nullable()
  ),
  settled_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "结算日期必须使用 YYYY-MM-DD 格式").nullable().optional(),
  note: z.string().optional()
});

export const createClassRecordInputSchema = z.object({
  date: dateSchema,
  teacher_id: idSchema,
  studio_id: optionalIdSchema,
  course_type: courseTypeSchema,
  course_name: z.string().trim().min(1, "请输入课程名称"),
  hours: positiveNumberFromFormSchema,
  student_count: z.preprocess((value) => Number(value), z.number().int().nonnegative()),
  member_id: optionalIdSchema,
  package_id: optionalIdSchema,
  manual_fee: optionalNumberFromFormSchema,
  note: z.string().optional()
});

export const updateClassRecordInputSchema = createClassRecordInputSchema;

export const createPerformanceInputSchema = z.object({
  date: dateSchema,
  teacher_id: idSchema,
  studio_id: optionalIdSchema,
  type: performanceTypeSchema,
  amount: nonnegativeNumberFromFormSchema,
  customer_name: z.string().optional(),
  member_id: optionalIdSchema,
  package_id: optionalIdSchema,
  commissionable: z.boolean(),
  note: z.string().optional()
});

export const updatePerformanceInputSchema = createPerformanceInputSchema;

export const createTeacherInputSchema = z.object({
  name: z.string().trim().min(1, "请填写姓名"),
  phone: z.string().optional(),
  note: z.string().optional()
});

export const updateTeacherInputSchema = createTeacherInputSchema;

export const createStudioInputSchema = z.object({
  name: z.string().trim().min(1, "请填写瑜伽馆名称"),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_name: z.string().optional(),
  note: z.string().optional()
});

export const updateStudioInputSchema = createStudioInputSchema;

export const createMemberInputSchema = z.object({
  name: z.string().trim().min(1, "请填写姓名"),
  phone: z.string().optional(),
  note: z.string().optional()
});

export const updateMemberInputSchema = createMemberInputSchema;

export const createMemberPackageInputSchema = z.object({
  member_id: idSchema,
  teacher_id: optionalIdSchema,
  studio_id: optionalIdSchema,
  package_name: z.string().trim().min(1, "请输入课包名称"),
  course_type: courseTypeSchema,
  total_amount: nonnegativeNumberFromFormSchema,
  total_sessions: positiveNumberFromFormSchema,
  purchase_date: dateSchema,
  note: z.string().optional()
});

export const updateMemberPackageInputSchema = createMemberPackageInputSchema;

export const loginInputSchema = z.object({
  email: z.string().trim().min(1, "请先输入邮箱").email("邮箱格式不太对"),
  password: z.string().min(6, "密码至少 6 位")
});

export const signupInputSchema = loginInputSchema
  .extend({
    confirmPassword: z.string().min(6, "确认密码至少 6 位")
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "两次输入的密码不一致"
  });
