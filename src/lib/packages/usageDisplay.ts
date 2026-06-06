import type { PackageUsage } from "@/lib/data/packageUsage";

export function formatSessionCount(value: number) {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
}

export function getPackageUsageLabel(usage: Pick<PackageUsage, "remainingSessions">) {
  if (usage.remainingSessions > 0) return `还剩 ${formatSessionCount(usage.remainingSessions)} 节`;
  if (usage.remainingSessions === 0) return "已上完";
  return `已超 ${formatSessionCount(Math.abs(usage.remainingSessions))} 节`;
}

export function getPackageUsageTone(usage: Pick<PackageUsage, "remainingSessions">): "success" | "warning" | "error" {
  if (usage.remainingSessions > 0) return "success";
  if (usage.remainingSessions === 0) return "warning";
  return "error";
}

export function buildOveruseWarning(hours: number, remainingSessions: number) {
  if (remainingSessions < 0) {
    return `这个课包已超出 ${formatSessionCount(Math.abs(remainingSessions))} 节，请确认是否需要续费或调整记录～`;
  }
  if (remainingSessions === 0) {
    return "这个课包已经上完啦，仍然可以记录，但建议确认是否续费～";
  }
  if (hours > remainingSessions) {
    return `本次记录 ${formatSessionCount(hours)} 节，但课包只剩 ${formatSessionCount(remainingSessions)} 节，保存后会超出课包课时～`;
  }
  return "";
}

export function getPackageFinishedMessage(usage: Pick<PackageUsage, "remainingSessions">) {
  if (usage.remainingSessions === 0) return "这个课包已经上完啦～";
  if (usage.remainingSessions < 0) return `这个课包已超出 ${formatSessionCount(Math.abs(usage.remainingSessions))} 节，请确认是否需要续费或调整记录～`;
  return `这个课包还剩 ${formatSessionCount(usage.remainingSessions)} 节～`;
}
