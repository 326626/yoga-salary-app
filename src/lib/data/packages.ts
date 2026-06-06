import type { MemberPackage } from "@/types";

import type { AppSupabaseClient } from "./types";

export type CreateMemberPackageInput = {
  member_id: string;
  teacher_id?: string | null;
  studio_id?: string | null;
  package_name: string;
  course_type: MemberPackage["course_type"];
  total_amount: number;
  total_sessions: number;
  purchase_date: string;
  note?: string | null;
  user_id?: string;
  unit_price?: number;
};
export type UpdateMemberPackageInput = CreateMemberPackageInput;

export function calculateUnitPrice(totalAmount: number, totalSessions: number) {
  return Math.round((totalAmount / totalSessions + Number.EPSILON) * 100) / 100;
}

export function buildCreateMemberPackagePayload(input: CreateMemberPackageInput, userId: string) {
  return {
    user_id: userId,
    member_id: input.member_id,
    teacher_id: input.teacher_id || null,
    studio_id: input.studio_id || null,
    package_name: input.package_name,
    course_type: input.course_type,
    total_amount: input.total_amount,
    total_sessions: input.total_sessions,
    unit_price: calculateUnitPrice(input.total_amount, input.total_sessions),
    purchase_date: input.purchase_date,
    note: input.note || null
  };
}

export function buildUpdateMemberPackagePayload(input: UpdateMemberPackageInput) {
  return {
    member_id: input.member_id,
    teacher_id: input.teacher_id || null,
    studio_id: input.studio_id || null,
    package_name: input.package_name,
    course_type: input.course_type,
    total_amount: input.total_amount,
    total_sessions: input.total_sessions,
    unit_price: calculateUnitPrice(input.total_amount, input.total_sessions),
    purchase_date: input.purchase_date,
    note: input.note || null
  };
}

export async function listMemberPackages(supabase: AppSupabaseClient, userId: string): Promise<MemberPackage[]> {
  const { data, error } = await supabase.from("packages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  if (error) throw new Error("读取课包失败，请稍后再试～");
  return (data ?? []) as MemberPackage[];
}

export const listPackages = listMemberPackages;

export async function getPackageDetail(supabase: AppSupabaseClient, userId: string, packageId: string): Promise<MemberPackage | null> {
  const { data, error } = await supabase.from("packages").select("*").eq("user_id", userId).eq("id", packageId).maybeSingle();
  if (error) throw new Error("读取课包失败，请稍后再试～");
  return (data as MemberPackage | null) ?? null;
}

export async function createMemberPackage(supabase: AppSupabaseClient, userId: string, input: CreateMemberPackageInput): Promise<MemberPackage> {
  const { data, error } = await supabase.from("packages").insert(buildCreateMemberPackagePayload(input, userId)).select("*").single();
  if (error) throw new Error("课包保存失败，请稍后再试～");
  return data as MemberPackage;
}

export async function updateMemberPackage(supabase: AppSupabaseClient, userId: string, packageId: string, input: UpdateMemberPackageInput): Promise<MemberPackage> {
  const { data, error } = await supabase
    .from("packages")
    .update(buildUpdateMemberPackagePayload(input))
    .eq("id", packageId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error("课包更新失败，请稍后再试～");
  return data as MemberPackage;
}

export async function deleteMemberPackage(supabase: AppSupabaseClient, userId: string, packageId: string) {
  const { error } = await supabase.from("packages").delete().eq("id", packageId).eq("user_id", userId);
  if (error) throw new Error("删除失败，请稍后再试～");
}
