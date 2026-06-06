import type { ClassRecord, MemberPackage, Performance } from "@/types";

import type { AppSupabaseClient } from "./types";

export type UnassignedRecords = {
  classes: ClassRecord[];
  performances: Performance[];
  packages: MemberPackage[];
  counts: {
    classes: number;
    performances: number;
    packages: number;
    total: number;
  };
};

export function buildAssignStudioPayload(studioId: string, _userIdFromForm?: string) {
  return { studio_id: studioId };
}

function countsFor(records: Pick<UnassignedRecords, "classes" | "performances" | "packages">) {
  return {
    classes: records.classes.length,
    performances: records.performances.length,
    packages: records.packages.length,
    total: records.classes.length + records.performances.length + records.packages.length
  };
}

export async function listUnassignedRecords(supabase: AppSupabaseClient, userId: string): Promise<UnassignedRecords> {
  const [classesResult, performancesResult, packagesResult] = await Promise.all([
    supabase.from("classes").select("*").eq("user_id", userId).is("studio_id", null).order("date", { ascending: false }),
    supabase.from("performances").select("*").eq("user_id", userId).is("studio_id", null).order("date", { ascending: false }),
    supabase.from("packages").select("*").eq("user_id", userId).is("studio_id", null).order("created_at", { ascending: false })
  ]);
  if (classesResult.error || performancesResult.error || packagesResult.error) {
    throw new Error("读取未归属记录失败，请稍后再试～");
  }
  const records = {
    classes: (classesResult.data ?? []) as ClassRecord[],
    performances: (performancesResult.data ?? []) as Performance[],
    packages: (packagesResult.data ?? []) as MemberPackage[]
  };

  return {
    ...records,
    counts: countsFor(records)
  };
}

export async function countUnassignedRecords(supabase: AppSupabaseClient, userId: string) {
  const records = await listUnassignedRecords(supabase, userId);
  return records.counts;
}

async function assignToStudio(supabase: AppSupabaseClient, table: "classes" | "performances" | "packages", userId: string, ids: string[], studioId: string) {
  if (ids.length === 0) return;
  const { error } = await supabase.from(table).update(buildAssignStudioPayload(studioId)).eq("user_id", userId).in("id", ids);
  if (error) throw new Error("整理失败，请稍后再试～");
}

export function assignClassesToStudio(supabase: AppSupabaseClient, userId: string, ids: string[], studioId: string) {
  return assignToStudio(supabase, "classes", userId, ids, studioId);
}

export function assignPerformancesToStudio(supabase: AppSupabaseClient, userId: string, ids: string[], studioId: string) {
  return assignToStudio(supabase, "performances", userId, ids, studioId);
}

export function assignPackagesToStudio(supabase: AppSupabaseClient, userId: string, ids: string[], studioId: string) {
  return assignToStudio(supabase, "packages", userId, ids, studioId);
}
