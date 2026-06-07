import { formatMoney } from "@/lib/salary/formatMoney";
import type { ClassRecord, Member, MemberPackage, Studio } from "@/types";

type PackageSummaryInput = {
  item: MemberPackage;
  members: Member[];
  studios: Studio[];
  remainingLabel: string;
};

type ClassSummaryInput = {
  record: ClassRecord;
  members: Member[];
  packages: MemberPackage[];
  studios: Studio[];
  courseTypeLabel: string;
};

export function buildPackageSummary({ item, members, studios, remainingLabel }: PackageSummaryInput) {
  const memberName = members.find((member) => member.id === item.member_id)?.name ?? "会员";
  const studioName = studios.find((studio) => studio.id === item.studio_id)?.name ?? "未选择瑜伽馆";

  return {
    title: `${memberName}｜${studioName}`,
    subtitle: item.package_name,
    meta: `${remainingLabel}｜¥${formatMoney(item.unit_price)}/节`
  };
}

export function buildClassSummary({ record, members, packages, studios, courseTypeLabel }: ClassSummaryInput) {
  const studioName = studios.find((studio) => studio.id === record.studio_id)?.name ?? "未选择瑜伽馆";
  const memberName = members.find((member) => member.id === record.member_id)?.name;
  const packageName = packages.find((item) => item.id === record.package_id)?.package_name;

  return {
    title: `${record.date}｜${record.course_name}`,
    subtitle: record.course_type === "private" ? [memberName, packageName].filter(Boolean).join("｜") : courseTypeLabel,
    meta: `${record.hours} 节｜${studioName}`
  };
}
