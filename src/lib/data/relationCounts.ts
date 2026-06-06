import type { AppSupabaseClient } from "./types";

async function countBy(supabase: AppSupabaseClient, table: string, userId: string, column: string, value: string) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true }).eq("user_id", userId).eq(column, value);
  if (error) throw new Error("读取关联记录失败，请稍后再试～");
  return count ?? 0;
}

export async function countMemberRelations(supabase: AppSupabaseClient, userId: string, memberId: string) {
  const [packages, classes, performances] = await Promise.all([
    countBy(supabase, "packages", userId, "member_id", memberId),
    countBy(supabase, "classes", userId, "member_id", memberId),
    countBy(supabase, "performances", userId, "member_id", memberId)
  ]);

  return { packages, classes, performances };
}

export async function countPackageRelations(supabase: AppSupabaseClient, userId: string, packageId: string) {
  const [classes, performances] = await Promise.all([
    countBy(supabase, "classes", userId, "package_id", packageId),
    countBy(supabase, "performances", userId, "package_id", packageId)
  ]);

  return { classes, performances };
}

export async function countTeacherRelations(supabase: AppSupabaseClient, userId: string, teacherId: string) {
  const [packages, classes, performances, salaryRules] = await Promise.all([
    countBy(supabase, "packages", userId, "teacher_id", teacherId),
    countBy(supabase, "classes", userId, "teacher_id", teacherId),
    countBy(supabase, "performances", userId, "teacher_id", teacherId),
    countBy(supabase, "salary_rules", userId, "teacher_id", teacherId)
  ]);

  return { packages, classes, performances, salaryRules };
}
