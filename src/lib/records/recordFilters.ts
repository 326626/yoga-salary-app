import type { ClassRecord, Performance, Studio } from "@/types";

export type StudioRecordFilter = "all" | "unassigned" | string;
export type CommissionableFilter = "all" | "true" | "false";

export type ClassRecordFilters = {
  month?: string;
  studioId?: StudioRecordFilter;
  memberId?: string;
};

export type PerformanceRecordFilters = ClassRecordFilters & {
  commissionable?: CommissionableFilter;
};

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

export function isInMonth(date: string, month?: string) {
  return month ? date.startsWith(`${month}-`) : true;
}

export function filterClasses(classes: ClassRecord[], filters: ClassRecordFilters) {
  const studioFilter = filters.studioId ?? "all";
  return filterClassesByStudio(classes, studioFilter)
    .filter((item) => isInMonth(item.date, filters.month))
    .filter((item) => (filters.memberId ? item.member_id === filters.memberId : true));
}

export function filterPerformances(performances: Performance[], filters: PerformanceRecordFilters) {
  const studioFilter = filters.studioId ?? "all";
  return filterPerformancesByStudio(performances, studioFilter)
    .filter((item) => isInMonth(item.date, filters.month))
    .filter((item) => (filters.memberId ? item.member_id === filters.memberId : true))
    .filter((item) => {
      if (!filters.commissionable || filters.commissionable === "all") return true;
      return filters.commissionable === "true" ? item.commissionable : !item.commissionable;
    });
}

export function summarizePerformances(performances: Performance[]) {
  return {
    count: performances.length,
    totalAmount: performances.reduce((sum, item) => sum + item.amount, 0),
    commissionableTotal: performances.filter((item) => item.commissionable).reduce((sum, item) => sum + item.amount, 0)
  };
}

export function getStudioFilterLabel(filter: StudioRecordFilter, studios: Studio[]) {
  if (filter === "all") return "全部瑜伽馆";
  if (isUnassignedFilter(filter)) return "未归属";
  return studios.find((studio) => studio.id === filter)?.name ?? "全部瑜伽馆";
}
