import { formatMoney } from "@/lib/salary/formatMoney";
import type { ClassRecord, Member, MemberPackage } from "@/types";

export function describeClassFeeContext(params: {
  classRecord?: ClassRecord;
  members: Member[];
  packages: MemberPackage[];
  formula: string;
}) {
  const member = params.members.find((item) => item.id === params.classRecord?.member_id);
  const memberPackage = params.packages.find((item) => item.id === params.classRecord?.package_id);
  const parts = [
    member?.name,
    memberPackage?.package_name,
    typeof memberPackage?.unit_price === "number" ? `${formatMoney(memberPackage.unit_price)} 元/节` : undefined,
    params.formula
  ].filter(Boolean);

  return parts.join("｜");
}

export function getPrivateClassPackageWarning(hasPackage: boolean) {
  return hasPackage ? "" : "这节私教课缺少课包，补充课包后工资会更准确～";
}
