import { formatMoney } from "@/lib/salary/formatMoney";
import type { ClassRecord, Member, MemberPackage, PackageItem } from "@/types";

export function describeClassFeeContext(params: {
  classRecord?: ClassRecord;
  members: Member[];
  packages: MemberPackage[];
  packageItems?: PackageItem[];
  formula: string;
}) {
  const member = params.members.find((item) => item.id === params.classRecord?.member_id);
  const memberPackage = params.packages.find((item) => item.id === params.classRecord?.package_id);
  const packageItem = params.packageItems?.find((item) => item.id === params.classRecord?.package_item_id);
  const unitPrice = packageItem?.unit_price ?? memberPackage?.unit_price;
  const parts = [
    member?.name,
    memberPackage?.package_name,
    packageItem?.item_name,
    typeof unitPrice === "number" ? `${formatMoney(unitPrice)} 元/节` : undefined,
    params.formula
  ].filter(Boolean);

  return parts.join("｜");
}

export function getPrivateClassPackageWarning(hasPackage: boolean) {
  return hasPackage ? "" : "这节私教课缺少课包，补充课包后工资会更准确～";
}
