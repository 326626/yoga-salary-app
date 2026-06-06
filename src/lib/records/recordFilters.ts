import type { ClassRecord, Performance, Studio } from "@/types";

export type StudioRecordFilter = "all" | "unassigned" | string;

export function isUnassignedFilter(filter: StudioRecordFilter) {
  return filter === "unassigned";
}

export function filterClassesByStudio(classes: ClassRecord[], filter: StudioRecordFilter) {
  if (filter === "all") return classes;
  if (isUnassignedFilter(filter)) return classes.filter((item) => !item.studio_id);
  return classes.filter((item) => item.studio_id === filter);
}

export function filterPerformancesByStudio(performances: Performance[], filter: StudioRecordFilter) {
  if (filter === "all") return performances;
  if (isUnassignedFilter(filter)) return performances.filter((item) => !item.studio_id);
  return performances.filter((item) => item.studio_id === filter);
}

export function getStudioFilterLabel(filter: StudioRecordFilter, studios: Studio[]) {
  if (filter === "all") return "全部瑜伽馆";
  if (isUnassignedFilter(filter)) return "未归属";
  return studios.find((studio) => studio.id === filter)?.name ?? "全部瑜伽馆";
}
