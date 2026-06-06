import type { Teacher } from "@/types";

import type { AppSupabaseClient } from "./types";

export type CreateTeacherInput = {
  name: string;
  phone?: string | null;
  note?: string | null;
  user_id?: string;
};
export type UpdateTeacherInput = CreateTeacherInput;

export function buildCreateTeacherPayload(input: CreateTeacherInput, userId: string) {
  return {
    user_id: userId,
    name: input.name,
    phone: input.phone ?? null,
    note: input.note ?? null
  };
}

export async function listTeachers(supabase: AppSupabaseClient, userId: string): Promise<Teacher[]> {
  const { data, error } = await supabase.from("teachers").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  if (error) throw new Error("读取老师失败，请稍后再试～");
  return (data ?? []) as Teacher[];
}

export async function createTeacher(supabase: AppSupabaseClient, userId: string, input: CreateTeacherInput): Promise<Teacher> {
  const { data, error } = await supabase.from("teachers").insert(buildCreateTeacherPayload(input, userId)).select("*").single();
  if (error) throw new Error("创建老师失败，请稍后再试～");
  return data as Teacher;
}

export function buildUpdateTeacherPayload(input: UpdateTeacherInput) {
  return {
    name: input.name,
    phone: input.phone ?? null,
    note: input.note ?? null
  };
}

export async function updateTeacher(supabase: AppSupabaseClient, userId: string, teacherId: string, input: UpdateTeacherInput): Promise<Teacher> {
  const { data, error } = await supabase
    .from("teachers")
    .update(buildUpdateTeacherPayload(input))
    .eq("id", teacherId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error("老师档案更新失败，请稍后再试～");
  return data as Teacher;
}

export async function deleteTeacher(supabase: AppSupabaseClient, userId: string, teacherId: string) {
  const { error } = await supabase.from("teachers").delete().eq("id", teacherId).eq("user_id", userId);
  if (error) throw new Error("删除失败，请稍后再试～");
}

export function createDefaultTeacher(supabase: AppSupabaseClient, userId: string): Promise<Teacher> {
  return createTeacher(supabase, userId, {
    name: "我的老师档案",
    note: "默认老师档案，可后续修改"
  });
}
