import type { SupabaseClient } from "@supabase/supabase-js";

export async function signInWithEmail(supabase: SupabaseClient, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error("邮箱或密码不正确，请再试一次～");
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

export async function signOut(supabase: SupabaseClient) {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error("退出失败，请稍后再试～");
  }
}
