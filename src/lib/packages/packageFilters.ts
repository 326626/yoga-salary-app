import type { MemberPackage } from "@/types";

export type PackageStudioFilter = "all" | "unassigned" | string;

export function filterPackagesByStudioAndMember(packages: MemberPackage[], studioFilter: PackageStudioFilter, memberFilter: string) {
  return packages.filter((item) => {
    const studioMatched =
      studioFilter === "all" ? true : studioFilter === "unassigned" ? !item.studio_id : item.studio_id === studioFilter;
    const memberMatched = memberFilter ? item.member_id === memberFilter : true;
    return studioMatched && memberMatched;
  });
}

export function getPackageFilterEmptyMessage(studioFilter: PackageStudioFilter, memberFilter: string) {
  if (memberFilter) return "这个会员还没有课包～";
  if (studioFilter && studioFilter !== "all") return "这个瑜伽馆还没有课包～";
  return "还没有课包，私教课建议先添加课包～";
}
