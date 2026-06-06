import { z } from "zod";

export const classPayRuleSchema = z
  .object({
    classType: z.enum(["group", "private", "trial", "other"]),
    payType: z.enum(["fixed", "percentage"]),
    amount: z.number().nonnegative().optional(),
    percentage: z.number().min(0).max(100).optional(),
    note: z.string().optional()
  })
  .refine((value) => value.payType !== "fixed" || typeof value.amount === "number", {
    message: "固定课时费规则必须包含 amount"
  })
  .refine((value) => value.payType !== "percentage" || typeof value.percentage === "number", {
    message: "比例课时费规则必须包含 percentage"
  });

export const performanceCommissionRuleSchema = z
  .object({
    category: z.enum(["new_package", "renewal", "other"]),
    commissionType: z.enum(["fixed", "percentage"]),
    amount: z.number().nonnegative().optional(),
    percentage: z.number().min(0).max(100).optional(),
    note: z.string().optional()
  })
  .refine((value) => value.commissionType !== "fixed" || typeof value.amount === "number", {
    message: "固定业绩提成规则必须包含 amount"
  })
  .refine((value) => value.commissionType !== "percentage" || typeof value.percentage === "number", {
    message: "比例业绩提成规则必须包含 percentage"
  });

export const parsedSalaryRuleSchema = z.object({
  name: z.string().min(1),
  status: z.literal("draft"),
  classPayRules: z.array(classPayRuleSchema),
  performanceCommissionRules: z.array(performanceCommissionRuleSchema),
  notes: z.array(z.string()).optional()
});

export const parseSalaryRuleInputSchema = z.object({
  text: z.string().min(1).max(5000)
});

export type ParsedSalaryRule = z.infer<typeof parsedSalaryRuleSchema>;
