import type { z } from "zod";

import type { createPerformanceInputSchema } from "@/lib/validation";
import type { Performance } from "@/types";

import type { AppSupabaseClient } from "./types";

export type CreatePerformanceInput = z.infer<typeof createPerformanceInputSchema> & {
  user_id?: string;
};
export type UpdatePerformanceInput = CreatePerformanceInput;

export function buildCreatePerformancePayload(input: CreatePerformanceInput, userId: string) {
  return {
    user_id: userId,
    teacher_id: input.teacher_id,
    studio_id: input.studio_id || null,
    member_id: input.member_id || null,
    package_id: input.package_id || null,
    date: input.date,
    customer_name: input.customer_name || null,
    type: input.type,
    amount: input.amount,
    commissionable: input.commissionable,
    note: input.note || null
  };
}

export function buildUpdatePerformancePayload(input: UpdatePerformanceInput) {
  return {
    teacher_id: input.teacher_id,
    studio_id: input.studio_id || null,
    member_id: input.member_id || null,
    package_id: input.package_id || null,
    date: input.date,
    customer_name: input.customer_name || null,
    type: input.type,
    amount: input.amount,
    commissionable: input.commissionable,
    note: input.note || null
  };
}

export async function listPerformances(supabase: AppSupabaseClient, userId: string): Promise<Performance[]> {
  const { data, error } = await supabase.from("performances").select("*").eq("user_id", userId).order("date", { ascending: false });
  if (error) throw new Error("读取业绩失败，请稍后再试～");
  return (data ?? []) as Performance[];
}

export async function listPerformancesByMember(supabase: AppSupabaseClient, userId: string, memberId: string): Promise<Performance[]> {
  const { data, error } = await supabase.from("performances").select("*").eq("user_id", userId).eq("member_id", memberId).order("date", { ascending: false });
  if (error) throw new Error("读取业绩失败，请稍后再试～");
  return (data ?? []) as Performance[];
}

export async function listPerformancesByPackage(supabase: AppSupabaseClient, userId: string, packageId: string): Promise<Performance[]> {
  const { data, error } = await supabase.from("performances").select("*").eq("user_id", userId).eq("package_id", packageId).order("date", { ascending: false });
  if (error) throw new Error("读取业绩失败，请稍后再试～");
  return (data ?? []) as Performance[];
}

export async function listPerformancesByStudio(supabase: AppSupabaseClient, userId: string, studioId: string): Promise<Performance[]> {
  const { data, error } = await supabase.from("performances").select("*").eq("user_id", userId).eq("studio_id", studioId).order("date", { ascending: false });
  if (error) throw new Error("读取业绩失败，请稍后再试～");
  return (data ?? []) as Performance[];
}

export async function listPerformancesByMonth(supabase: AppSupabaseClient, userId: string, month: string): Promise<Performance[]> {
  const { data, error } = await supabase.from("performances").select("*").eq("user_id", userId).gte("date", `${month}-01`).lte("date", `${month}-31`).order("date", { ascending: false });
  if (error) throw new Error("读取业绩失败，请稍后再试～");
  return (data ?? []) as Performance[];
}

export async function createPerformance(supabase: AppSupabaseClient, userId: string, input: CreatePerformanceInput): Promise<Performance> {
  const { data, error } = await supabase.from("performances").insert(buildCreatePerformancePayload(input, userId)).select("*").single();
  if (error) throw new Error("保存失败，请稍后再试～");
  return data as Performance;
}

export async function updatePerformance(supabase: AppSupabaseClient, userId: string, performanceId: string, input: UpdatePerformanceInput): Promise<Performance> {
  const { data, error } = await supabase
    .from("performances")
    .update(buildUpdatePerformancePayload(input))
    .eq("id", performanceId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error("业绩更新失败，请稍后再试～");
  return data as Performance;
}

export async function deletePerformance(supabase: AppSupabaseClient, userId: string, performanceId: string) {
  const { error } = await supabase.from("performances").delete().eq("id", performanceId).eq("user_id", userId);
  if (error) throw new Error("删除失败，请稍后再试～");
}
