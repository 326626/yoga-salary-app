import type { SupabaseClient } from "@supabase/supabase-js";

import { toSupabasePhone } from "@/lib/auth/phone";

export async function signInWithEmail(supabase: SupabaseClient, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error("邮箱或密码不正确，或者邮箱还没有确认～");
  }
  return data;
}

export async function signUpWithEmail(supabase: SupabaseClient, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw new Error("注册失败，请稍后再试～");
  }
  return data;
}

export async function signInWithPhone(supabase: SupabaseClient, phone: string, password: string) {
  const normalizedPhone = toSupabasePhone(phone);
  const { data, error } = await supabase.auth.signInWithPassword({ phone: normalizedPhone, password });
  if (error) {
    throw new Error("手机号或密码不正确，或者当前手机号登录暂不可用～");
  }
  return data;
}

export async function signUpWithPhone(supabase: SupabaseClient, phone: string, password: string) {
  const normalizedPhone = toSupabasePhone(phone);
  const { data, error } = await supabase.auth.signUp({ phone: normalizedPhone, password });
  if (error) {
    throw new Error("当前手机号注册暂不可用，可以先使用邮箱注册～");
  }
  return data;
}

export async function signOut(supabase: SupabaseClient) {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error("退出失败，请稍后再试～");
  }
}
