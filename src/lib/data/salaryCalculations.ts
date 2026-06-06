import type { z } from "zod";

import type { createSalaryCalculationInputSchema, settlementInputSchema, updateSalaryCalculationInputSchema } from "@/lib/validation";
import type { SalaryCalculation } from "@/types";

import type { AppSupabaseClient } from "./types";

export type CreateSalaryCalculationInput = z.infer<typeof createSalaryCalculationInputSchema> & {
  user_id?: string;
};
export type UpdateSalaryCalculationInput = z.infer<typeof updateSalaryCalculationInputSchema> & {
  user_id?: string;
};
export type SettlementInput = z.infer<typeof settlementInputSchema>;

export function buildCreateSalaryCalculationPayload(input: CreateSalaryCalculationInput, userId: string) {
  return {
    user_id: userId,
    teacher_id: input.teacher_id,
    studio_id: input.studio_id || null,
    month: input.month,
    class_fee_total: input.class_fee_total,
    performance_total: input.performance_total,
    commission_total: input.commission_total,
    bonus_total: input.bonus_total,
    deduction_total: input.deduction_total,
    salary_total: input.salary_total,
    breakdown: input.breakdown,
    status: input.status ?? "unsettled",
    actual_paid_amount: input.actual_paid_amount ?? null,
    settled_at: input.settled_at ?? null,
    note: input.note || null
  };
}

export function buildUpdateSalaryCalculationPayload(input: UpdateSalaryCalculationInput) {
  return {
    ...(input.teacher_id ? { teacher_id: input.teacher_id } : {}),
    ...(typeof input.studio_id !== "undefined" ? { studio_id: input.studio_id || null } : {}),
    ...(input.month ? { month: input.month } : {}),
    ...(typeof input.class_fee_total !== "undefined" ? { class_fee_total: input.class_fee_total } : {}),
    ...(typeof input.performance_total !== "undefined" ? { performance_total: input.performance_total } : {}),
    ...(typeof input.commission_total !== "undefined" ? { commission_total: input.commission_total } : {}),
    ...(typeof input.bonus_total !== "undefined" ? { bonus_total: input.bonus_total } : {}),
    ...(typeof input.deduction_total !== "undefined" ? { deduction_total: input.deduction_total } : {}),
    ...(typeof input.salary_total !== "undefined" ? { salary_total: input.salary_total } : {}),
    ...(input.breakdown ? { breakdown: input.breakdown } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(typeof input.actual_paid_amount !== "undefined" ? { actual_paid_amount: input.actual_paid_amount } : {}),
    ...(typeof input.settled_at !== "undefined" ? { settled_at: input.settled_at } : {}),
    ...(typeof input.note !== "undefined" ? { note: input.note || null } : {}),
    updated_at: new Date().toISOString()
  };
}

export function buildSettlementPayload(input: SettlementInput) {
  return {
    status: input.status,
    actual_paid_amount: input.actual_paid_amount ?? null,
    settled_at: input.status === "settled" ? input.settled_at ?? new Date().toISOString().slice(0, 10) : null,
    note: input.note || null,
    updated_at: new Date().toISOString()
  };
}

export async function listSalaryCalculations(supabase: AppSupabaseClient, userId: string): Promise<SalaryCalculation[]> {
  const { data, error } = await supabase.from("salary_calculations").select("*").eq("user_id", userId).order("month", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw new Error("读取工资历史失败，请稍后再试～");
  return (data ?? []) as SalaryCalculation[];
}

export async function getSalaryCalculation(supabase: AppSupabaseClient, userId: string, calculationId: string): Promise<SalaryCalculation | null> {
  const { data, error } = await supabase.from("salary_calculations").select("*").eq("user_id", userId).eq("id", calculationId).maybeSingle();
  if (error) throw new Error("读取工资快照失败，请稍后再试～");
  return (data as SalaryCalculation | null) ?? null;
}

export async function findSalaryCalculationByMonthAndStudio(supabase: AppSupabaseClient, userId: string, month: string, studioId?: string | null): Promise<SalaryCalculation | null> {
  let query = supabase.from("salary_calculations").select("*").eq("user_id", userId).eq("month", month);
  query = studioId ? query.eq("studio_id", studioId) : query.is("studio_id", null);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("读取工资快照失败，请稍后再试～");
  return (data as SalaryCalculation | null) ?? null;
}

export async function createSalaryCalculation(supabase: AppSupabaseClient, userId: string, input: CreateSalaryCalculationInput): Promise<SalaryCalculation> {
  const { data, error } = await supabase.from("salary_calculations").insert(buildCreateSalaryCalculationPayload(input, userId)).select("*").single();
  if (error) throw new Error("保存工资快照失败，请稍后再试～");
  return data as SalaryCalculation;
}

export async function updateSalaryCalculation(supabase: AppSupabaseClient, userId: string, calculationId: string, input: UpdateSalaryCalculationInput): Promise<SalaryCalculation> {
  const { data, error } = await supabase
    .from("salary_calculations")
    .update(buildUpdateSalaryCalculationPayload(input))
    .eq("id", calculationId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error("更新工资快照失败，请稍后再试～");
  return data as SalaryCalculation;
}

export async function deleteSalaryCalculation(supabase: AppSupabaseClient, userId: string, calculationId: string) {
  const { error } = await supabase.from("salary_calculations").delete().eq("id", calculationId).eq("user_id", userId);
  if (error) throw new Error("删除工资快照失败，请稍后再试～");
}

export async function markSalaryCalculationSettled(supabase: AppSupabaseClient, userId: string, calculationId: string, input: Omit<SettlementInput, "status">): Promise<SalaryCalculation> {
  const { data, error } = await supabase
    .from("salary_calculations")
    .update(buildSettlementPayload({ ...input, status: "settled" }))
    .eq("id", calculationId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error("更新结算信息失败，请稍后再试～");
  return data as SalaryCalculation;
}

export async function markSalaryCalculationUnsettled(supabase: AppSupabaseClient, userId: string, calculationId: string, input?: Pick<SettlementInput, "actual_paid_amount" | "note">): Promise<SalaryCalculation> {
  const { data, error } = await supabase
    .from("salary_calculations")
    .update(buildSettlementPayload({ status: "unsettled", actual_paid_amount: input?.actual_paid_amount ?? null, settled_at: null, note: input?.note ?? "" }))
    .eq("id", calculationId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error("更新结算状态失败，请稍后再试～");
  return data as SalaryCalculation;
}
