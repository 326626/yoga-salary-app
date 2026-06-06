import type { Studio } from "@/types";

import type { AppSupabaseClient } from "./types";

export type CreateStudioInput = {
  name: string;
  phone?: string | null;
  address?: string | null;
  contact_name?: string | null;
  note?: string | null;
  user_id?: string;
};
export type UpdateStudioInput = CreateStudioInput;

export function buildCreateStudioPayload(input: CreateStudioInput, userId: string) {
  return {
    user_id: userId,
    name: input.name,
    phone: input.phone ?? null,
    address: input.address ?? null,
    contact_name: input.contact_name ?? null,
    note: input.note ?? null
  };
}

export function buildUpdateStudioPayload(input: UpdateStudioInput) {
  return {
    name: input.name,
    phone: input.phone ?? null,
    address: input.address ?? null,
    contact_name: input.contact_name ?? null,
    note: input.note ?? null
  };
}

export async function listStudios(supabase: AppSupabaseClient, userId: string): Promise<Studio[]> {
  const { data, error } = await supabase.from("studios").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  if (error) throw new Error("读取瑜伽馆失败，请稍后再试～");
  return (data ?? []) as Studio[];
}

export async function getStudioDetail(supabase: AppSupabaseClient, userId: string, studioId: string): Promise<Studio | null> {
  const { data, error } = await supabase.from("studios").select("*").eq("user_id", userId).eq("id", studioId).maybeSingle();
  if (error) throw new Error("读取瑜伽馆失败，请稍后再试～");
  return (data as Studio | null) ?? null;
}

export async function createStudio(supabase: AppSupabaseClient, userId: string, input: CreateStudioInput): Promise<Studio> {
  const { data, error } = await supabase.from("studios").insert(buildCreateStudioPayload(input, userId)).select("*").single();
  if (error) throw new Error("瑜伽馆保存失败，请稍后再试～");
  return data as Studio;
}

export async function updateStudio(supabase: AppSupabaseClient, userId: string, studioId: string, input: UpdateStudioInput): Promise<Studio> {
  const { data, error } = await supabase
    .from("studios")
    .update(buildUpdateStudioPayload(input))
    .eq("id", studioId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error("瑜伽馆更新失败，请稍后再试～");
  return data as Studio;
}

export async function deleteStudio(supabase: AppSupabaseClient, userId: string, studioId: string) {
  const { error } = await supabase.from("studios").delete().eq("id", studioId).eq("user_id", userId);
  if (error) throw new Error("暂时不能删除，因为还有关联记录。可以先保留这个瑜伽馆～");
}

async function countByStudio(supabase: AppSupabaseClient, table: string, userId: string, studioId: string) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true }).eq("user_id", userId).eq("studio_id", studioId);
  if (error) throw new Error("读取关联记录失败，请稍后再试～");
  return count ?? 0;
}

export async function countStudioRelations(supabase: AppSupabaseClient, userId: string, studioId: string) {
  const [packages, classes, performances, salaryRules, salaryCalculations] = await Promise.all([
    countByStudio(supabase, "packages", userId, studioId),
    countByStudio(supabase, "classes", userId, studioId),
    countByStudio(supabase, "performances", userId, studioId),
    countByStudio(supabase, "salary_rules", userId, studioId),
    countByStudio(supabase, "salary_calculations", userId, studioId)
  ]);

  return { packages, classes, performances, salaryRules, salaryCalculations };
}
