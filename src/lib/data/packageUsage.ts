import type { ClassRecord, MemberPackage, PackageItem } from "@/types";

import { listClasses, listClassesByPackage } from "./classes";
import { getPackageDetail } from "./packages";
import type { AppSupabaseClient } from "./types";

export type PackageUsage = {
  packageId: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  isOverused: boolean;
  itemUsages?: PackageItemUsage[];
};

export type PackageItemUsage = {
  packageItemId: string;
  packageId: string;
  itemName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  isOverused: boolean;
};

function roundSessions(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculatePackageItemUsage(item: Pick<PackageItem, "id" | "package_id" | "item_name" | "sessions">, classes: Pick<ClassRecord, "package_item_id" | "hours">[]): PackageItemUsage {
  const usedSessions = roundSessions(
    classes
      .filter((classRecord) => classRecord.package_item_id === item.id)
      .reduce((total, classRecord) => total + Number(classRecord.hours || 0), 0)
  );
  const totalSessions = Number(item.sessions || 0);
  const remainingSessions = roundSessions(totalSessions - usedSessions);

  return {
    packageItemId: item.id,
    packageId: item.package_id,
    itemName: item.item_name,
    totalSessions,
    usedSessions,
    remainingSessions,
    isOverused: remainingSessions < 0
  };
}

export function calculatePackageUsageFromClasses(memberPackage: Pick<MemberPackage, "id" | "total_sessions">, classes: Pick<ClassRecord, "package_id" | "package_item_id" | "hours">[], packageItems: PackageItem[] = []): PackageUsage {
  const items = packageItems.filter((item) => item.package_id === memberPackage.id);
  if (items.length > 0) {
    const itemUsages = items.map((item) => calculatePackageItemUsage(item, classes));
    const legacyUsedSessions = roundSessions(
      classes
        .filter((item) => item.package_id === memberPackage.id && !item.package_item_id)
        .reduce((total, item) => total + Number(item.hours || 0), 0)
    );
    const totalSessions = roundSessions(itemUsages.reduce((sum, item) => sum + item.totalSessions, 0));
    const usedSessions = roundSessions(itemUsages.reduce((sum, item) => sum + item.usedSessions, 0) + legacyUsedSessions);
    const remainingSessions = roundSessions(totalSessions - usedSessions);
    return { packageId: memberPackage.id, totalSessions, usedSessions, remainingSessions, isOverused: remainingSessions < 0, itemUsages };
  }

  const usedSessions = roundSessions(classes.filter((item) => item.package_id === memberPackage.id).reduce((total, item) => total + Number(item.hours || 0), 0));
  const totalSessions = Number(memberPackage.total_sessions || 0);
  const remainingSessions = roundSessions(totalSessions - usedSessions);

  return { packageId: memberPackage.id, totalSessions, usedSessions, remainingSessions, isOverused: remainingSessions < 0 };
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
