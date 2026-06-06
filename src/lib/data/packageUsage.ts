import type { ClassRecord, MemberPackage } from "@/types";

import { listClasses, listClassesByPackage } from "./classes";
import { getPackageDetail } from "./packages";
import type { AppSupabaseClient } from "./types";

export type PackageUsage = {
  packageId: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  isOverused: boolean;
};

function roundSessions(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculatePackageUsageFromClasses(memberPackage: Pick<MemberPackage, "id" | "total_sessions">, classes: Pick<ClassRecord, "package_id" | "hours">[]): PackageUsage {
  const usedSessions = roundSessions(
    classes
      .filter((item) => item.package_id === memberPackage.id)
      .reduce((total, item) => total + Number(item.hours || 0), 0)
  );
  const totalSessions = Number(memberPackage.total_sessions || 0);
  const remainingSessions = roundSessions(totalSessions - usedSessions);

  return {
    packageId: memberPackage.id,
    totalSessions,
    usedSessions,
    remainingSessions,
    isOverused: remainingSessions < 0
  };
}

export async function getPackageUsage(supabase: AppSupabaseClient, userId: string, packageId: string): Promise<PackageUsage | null> {
  const memberPackage = await getPackageDetail(supabase, userId, packageId);
  if (!memberPackage) return null;
  const classes = await listClassesByPackage(supabase, userId, packageId);
  return calculatePackageUsageFromClasses(memberPackage, classes);
}

export async function getPackageUsages(supabase: AppSupabaseClient, userId: string, packages: MemberPackage[]): Promise<Record<string, PackageUsage>> {
  const classes = await listClasses(supabase, userId);
  return Object.fromEntries(packages.map((item) => [item.id, calculatePackageUsageFromClasses(item, classes)]));
}
