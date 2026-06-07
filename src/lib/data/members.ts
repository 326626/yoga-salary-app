import type { Member } from "@/types";

import type { AppSupabaseClient } from "./types";

export type CreateMemberInput = {
  studio_id: string;
  name: string;
  phone?: string | null;
  note?: string | null;
  user_id?: string;
};
export type UpdateMemberInput = CreateMemberInput;

export function buildCreateMemberPayload(input: CreateMemberInput, userId: string) {
  return {
    user_id: userId,
    studio_id: input.studio_id,
    name: input.name,
    phone: input.phone ?? null,
    note: input.note ?? null
  };
}

export function buildUpdateMemberPayload(input: UpdateMemberInput) {
  return {
    name: input.name,
    studio_id: input.studio_id,
    phone: input.phone ?? null,
    note: input.note ?? null
  };
}

export async function listMembers(supabase: AppSupabaseClient, userId: string): Promise<Member[]> {
  const { data, error } = await supabase.from("members").select("*").eq("user_id", userId).order("created_at", { ascending: true });
  if (error) throw new Error("读取会员失败，请稍后再试～");
  return (data ?? []) as Member[];
}

export async function listMembersByStudio(supabase: AppSupabaseClient, userId: string, studioId: string): Promise<Member[]> {
  const { data, error } = await supabase.from("members").select("*").eq("user_id", userId).eq("studio_id", studioId).order("created_at", { ascending: true });
  if (error) throw new Error("读取会员失败，请稍后再试～");
  return (data ?? []) as Member[];
}

export async function getMemberDetail(supabase: AppSupabaseClient, userId: string, memberId: string): Promise<Member | null> {
  const { data, error } = await supabase.from("members").select("*").eq("user_id", userId).eq("id", memberId).maybeSingle();
  if (error) throw new Error("读取会员失败，请稍后再试～");
  return (data as Member | null) ?? null;
}

export async function createMember(supabase: AppSupabaseClient, userId: string, input: CreateMemberInput): Promise<Member> {
  const { data, error } = await supabase.from("members").insert(buildCreateMemberPayload(input, userId)).select("*").single();
  if (error) throw new Error("会员保存失败，请稍后再试～");
  return data as Member;
}

export async function updateMember(supabase: AppSupabaseClient, userId: string, memberId: string, input: UpdateMemberInput): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .update(buildUpdateMemberPayload(input))
    .eq("id", memberId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error("会员更新失败，请稍后再试～");
  return data as Member;
}

export async function deleteMember(supabase: AppSupabaseClient, userId: string, memberId: string) {
  const { error } = await supabase.from("members").delete().eq("id", memberId).eq("user_id", userId);
  if (error) throw new Error("删除失败，请稍后再试～");
}
