import type { SalaryRule, StructuredSalaryRule } from "@/types";

import type { AppSupabaseClient } from "./types";

export type CreateSalaryRuleInput = {
  teacher_id?: string | null;
  studio_id?: string | null;
  name: string;
  raw_text: string;
  structured_rule: StructuredSalaryRule;
  source_type?: "manual" | "image_ai";
  active?: boolean;
  user_id?: string;
};

export function buildCreateSalaryRulePayload(input: CreateSalaryRuleInput, userId: string) {
  return {
    user_id: userId,
    teacher_id: input.teacher_id ?? null,
    studio_id: input.studio_id ?? null,
    name: input.name,
    raw_text: input.raw_text,
    structured_rule: input.structured_rule,
    source_type: input.source_type ?? "manual",
    active: input.active ?? true
  };
}

export async function getActiveSalaryRule(supabase: AppSupabaseClient, userId: string): Promise<SalaryRule | null> {
  const { data, error } = await supabase
    .from("salary_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("读取工资规则失败，请稍后再试～");
  return (data as SalaryRule | null) ?? null;
}

export async function listSalaryRules(supabase: AppSupabaseClient, userId: string): Promise<SalaryRule[]> {
  const { data, error } = await supabase.from("salary_rules").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error("读取工资规则失败，请稍后再试～");
  return (data ?? []) as SalaryRule[];
}

export async function deactivateSalaryRules(supabase: AppSupabaseClient, userId: string, studioId?: string | null) {
  let query = supabase.from("salary_rules").update({ active: false }).eq("user_id", userId).eq("active", true);
  query = studioId ? query.eq("studio_id", studioId) : query.is("studio_id", null);
  const { error } = await query;
  if (error) throw new Error("更新工资规则失败，请稍后再试～");
}

export async function createSalaryRule(supabase: AppSupabaseClient, userId: string, input: CreateSalaryRuleInput): Promise<SalaryRule> {
  const { data, error } = await supabase.from("salary_rules").insert(buildCreateSalaryRulePayload(input, userId)).select("*").single();
  if (error) throw new Error("保存工资规则失败，请稍后再试～");
  return data as SalaryRule;
}
