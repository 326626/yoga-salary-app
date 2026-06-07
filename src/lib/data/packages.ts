import type { MemberPackage } from "@/types";

import { createPackageItems, type CreatePackageItemInput } from "./packageItems";
import type { AppSupabaseClient } from "./types";

export type CreateMemberPackageInput = {
  package_mode?: "single" | "bundle";
  member_id: string;
  teacher_id?: string | null;
  studio_id?: string | null;
  pricing_mode?: "total_amount" | "unit_price";
  package_name: string;
  course_type: MemberPackage["course_type"];
  total_amount?: number;
  total_sessions: number;
  unit_price?: number;
  purchase_date: string;
  note?: string | null;
  items?: Array<{
    item_name: string;
    course_type: MemberPackage["course_type"];
    sessions: number;
    unit_price: number;
    note?: string | null;
  }>;
  user_id?: string;
};
export type UpdateMemberPackageInput = CreateMemberPackageInput;

export function calculateUnitPrice(totalAmount: number, totalSessions: number) {
  return Math.round((totalAmount / totalSessions + Number.EPSILON) * 100) / 100;
}

export function calculateTotalAmount(unitPrice: number, totalSessions: number) {
  return Math.round((unitPrice * totalSessions + Number.EPSILON) * 100) / 100;
}

export function calculatePackagePricing(input: Pick<CreateMemberPackageInput, "pricing_mode" | "total_amount" | "total_sessions" | "unit_price">) {
  if (input.pricing_mode === "unit_price") {
    const unitPrice = input.unit_price ?? 0;
    const totalAmount = calculateTotalAmount(unitPrice, input.total_sessions);
    return { total_amount: totalAmount, total_sessions: input.total_sessions, unit_price: unitPrice };
  }
  const totalAmount = input.total_amount ?? 0;
  return { total_amount: totalAmount, total_sessions: input.total_sessions, unit_price: calculateUnitPrice(totalAmount, input.total_sessions) };
}

export function calculateBundlePackagePricing(items: NonNullable<CreateMemberPackageInput["items"]>) {
  const totalSessions = items.reduce((sum, item) => sum + Number(item.sessions || 0), 0);
  const totalAmount = Math.round((items.reduce((sum, item) => sum + Number(item.sessions || 0) * Number(item.unit_price || 0), 0) + Number.EPSILON) * 100) / 100;
  return {
    total_amount: totalAmount,
    total_sessions: totalSessions,
    unit_price: totalSessions > 0 ? calculateUnitPrice(totalAmount, totalSessions) : 0
  };
}

export function getPackagePricing(input: CreateMemberPackageInput) {
  if (input.package_mode === "bundle" && input.items && input.items.length > 0) {
    return calculateBundlePackagePricing(input.items);
  }
  return calculatePackagePricing(input);
}

export function buildCreateMemberPackagePayload(input: CreateMemberPackageInput, userId: string) {
  const pricing = getPackagePricing(input);
  return {
    user_id: userId,
    member_id: input.member_id,
    teacher_id: input.teacher_id || null,
    studio_id: input.studio_id || null,
    package_name: input.package_name,
    course_type: input.course_type,
    total_amount: pricing.total_amount,
    total_sessions: pricing.total_sessions,
    unit_price: pricing.unit_price,
    purchase_date: input.purchase_date,
    note: input.note || null
  };
}

export function buildUpdateMemberPackagePayload(input: UpdateMemberPackageInput) {
  const pricing = getPackagePricing(input);
  return {
    member_id: input.member_id,
    teacher_id: input.teacher_id || null,
    studio_id: input.studio_id || null,
    package_name: input.package_name,
    course_type: input.course_type,
    total_amount: pricing.total_amount,
    total_sessions: pricing.total_sessions,
    unit_price: pricing.unit_price,
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
  const memberPackage = data as MemberPackage;
  const itemInputs: CreatePackageItemInput[] = input.package_mode === "bundle" && input.items && input.items.length > 0
    ? input.items.map((item) => ({
      package_id: memberPackage.id,
      studio_id: memberPackage.studio_id,
      member_id: memberPackage.member_id,
      item_name: item.item_name,
      course_type: item.course_type,
      sessions: item.sessions,
      unit_price: item.unit_price,
      note: item.note
    }))
    : [{
      package_id: memberPackage.id,
      studio_id: memberPackage.studio_id,
      member_id: memberPackage.member_id,
      item_name: input.package_name,
      course_type: input.course_type,
      sessions: memberPackage.total_sessions,
      unit_price: memberPackage.unit_price,
      note: input.note
    }];
  await createPackageItems(supabase, userId, itemInputs);
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
