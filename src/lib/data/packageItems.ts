import type { CourseType, PackageItem } from "@/types";

import type { AppSupabaseClient } from "./types";

export type CreatePackageItemInput = {
  package_id: string;
  studio_id?: string | null;
  member_id?: string | null;
  item_name: string;
  course_type: CourseType;
  sessions: number;
  unit_price: number;
  note?: string | null;
  user_id?: string;
};

export function roundPackageMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildCreatePackageItemPayload(input: CreatePackageItemInput, userId: string) {
  return {
    user_id: userId,
    package_id: input.package_id,
    studio_id: input.studio_id ?? null,
    member_id: input.member_id ?? null,
    item_name: input.item_name,
    course_type: input.course_type,
    sessions: input.sessions,
    unit_price: input.unit_price,
    total_amount: roundPackageMoney(input.sessions * input.unit_price),
    note: input.note || null
  };
}

export async function listPackageItems(supabase: AppSupabaseClient, userId: string): Promise<PackageItem[]> {
  const { data, error } = await supabase.from("package_items").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  if (error) throw new Error("读取课包项目失败，请稍后再试～");
  return (data ?? []) as PackageItem[];
}

export async function listPackageItemsByPackage(supabase: AppSupabaseClient, userId: string, packageId: string): Promise<PackageItem[]> {
  const { data, error } = await supabase.from("package_items").select("*").eq("user_id", userId).eq("package_id", packageId).order("created_at", { ascending: true });
  if (error) throw new Error("读取课包项目失败，请稍后再试～");
  return (data ?? []) as PackageItem[];
}

export async function createPackageItems(supabase: AppSupabaseClient, userId: string, inputs: CreatePackageItemInput[]): Promise<PackageItem[]> {
  if (inputs.length === 0) return [];
  const { data, error } = await supabase.from("package_items").insert(inputs.map((input) => buildCreatePackageItemPayload(input, userId))).select("*");
  if (error) throw new Error("课包项目保存失败，请稍后再试～");
  return (data ?? []) as PackageItem[];
}

export async function deletePackageItem(supabase: AppSupabaseClient, userId: string, itemId: string) {
  const { error } = await supabase.from("package_items").delete().eq("id", itemId).eq("user_id", userId);
  if (error) throw new Error("删除课包项目失败，请稍后再试～");
}
