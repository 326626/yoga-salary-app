import type { z } from "zod";

import type { createClassRecordInputSchema } from "@/lib/validation";
import type { ClassRecord } from "@/types";

import type { AppSupabaseClient } from "./types";

export type CreateClassRecordInput = z.infer<typeof createClassRecordInputSchema> & {
  user_id?: string;
};
export type UpdateClassRecordInput = CreateClassRecordInput;

export function buildCreateClassRecordPayload(input: CreateClassRecordInput, userId: string) {
  return {
    user_id: userId,
    teacher_id: input.teacher_id,
    studio_id: input.studio_id || null,
    member_id: input.member_id || null,
    package_id: input.package_id || null,
    date: input.date,
    course_name: input.course_name,
    course_type: input.course_type,
    student_count: input.student_count,
    hours: input.hours,
    manual_fee: input.manual_fee ?? null,
    note: input.note || null
  };
}

export function buildUpdateClassRecordPayload(input: UpdateClassRecordInput) {
  return {
    teacher_id: input.teacher_id,
    studio_id: input.studio_id || null,
    member_id: input.member_id || null,
    package_id: input.package_id || null,
    date: input.date,
    course_name: input.course_name,
    course_type: input.course_type,
    student_count: input.student_count,
    hours: input.hours,
    manual_fee: input.manual_fee ?? null,
    note: input.note || null
  };
}

export async function listClasses(supabase: AppSupabaseClient, userId: string): Promise<ClassRecord[]> {
  const { data, error } = await supabase.from("classes").select("*").eq("user_id", userId).order("date", { ascending: false });
  if (error) throw new Error("读取课程失败，请稍后再试～");
  return (data ?? []) as ClassRecord[];
}

export async function listClassesByMember(supabase: AppSupabaseClient, userId: string, memberId: string): Promise<ClassRecord[]> {
  const { data, error } = await supabase.from("classes").select("*").eq("user_id", userId).eq("member_id", memberId).order("date", { ascending: false });
  if (error) throw new Error("读取课程失败，请稍后再试～");
  return (data ?? []) as ClassRecord[];
}

export async function listClassesByPackage(supabase: AppSupabaseClient, userId: string, packageId: string): Promise<ClassRecord[]> {
  const { data, error } = await supabase.from("classes").select("*").eq("user_id", userId).eq("package_id", packageId).order("date", { ascending: false });
  if (error) throw new Error("读取课程失败，请稍后再试～");
  return (data ?? []) as ClassRecord[];
}

export async function listClassesByStudio(supabase: AppSupabaseClient, userId: string, studioId: string): Promise<ClassRecord[]> {
  const { data, error } = await supabase.from("classes").select("*").eq("user_id", userId).eq("studio_id", studioId).order("date", { ascending: false });
  if (error) throw new Error("读取课程失败，请稍后再试～");
  return (data ?? []) as ClassRecord[];
}

export async function listClassesByMonth(supabase: AppSupabaseClient, userId: string, month: string): Promise<ClassRecord[]> {
  const { data, error } = await supabase.from("classes").select("*").eq("user_id", userId).gte("date", `${month}-01`).lte("date", `${month}-31`).order("date", { ascending: false });
  if (error) throw new Error("读取课程失败，请稍后再试～");
  return (data ?? []) as ClassRecord[];
}

export async function createClassRecord(supabase: AppSupabaseClient, userId: string, input: CreateClassRecordInput): Promise<ClassRecord> {
  const { data, error } = await supabase.from("classes").insert(buildCreateClassRecordPayload(input, userId)).select("*").single();
  if (error) throw new Error("保存失败，请稍后再试～");
  return data as ClassRecord;
}

export async function updateClassRecord(supabase: AppSupabaseClient, userId: string, classId: string, input: UpdateClassRecordInput): Promise<ClassRecord> {
  const { data, error } = await supabase
    .from("classes")
    .update(buildUpdateClassRecordPayload(input))
    .eq("id", classId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error("课程更新失败，请稍后再试～");
  return data as ClassRecord;
}

export async function deleteClassRecord(supabase: AppSupabaseClient, userId: string, classId: string) {
  const { error } = await supabase.from("classes").delete().eq("id", classId).eq("user_id", userId);
  if (error) throw new Error("删除失败，请稍后再试～");
}
