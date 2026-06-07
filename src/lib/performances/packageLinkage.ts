import type { Member, MemberPackage } from "@/types";

export type PerformancePackageLinkageForm = {
  member_id: string;
  studio_id: string;
  amount: string;
  customer_name: string;
};

export function filterPerformancePackagesForMember(packages: MemberPackage[], memberId?: string) {
  return memberId ? packages.filter((item) => item.member_id === memberId) : packages;
}

export function derivePerformancePackageSelection(params: {
  packageId: string;
  packages: MemberPackage[];
  members: Member[];
  currentForm: PerformancePackageLinkageForm;
  amountTouched?: boolean;
}) {
  const selectedPackage = params.packages.find((item) => item.id === params.packageId);
  if (!selectedPackage) return params.currentForm;

  const member = params.members.find((item) => item.id === selectedPackage.member_id);

  return {
    ...params.currentForm,
    member_id: selectedPackage.member_id,
    studio_id: selectedPackage.studio_id ?? params.currentForm.studio_id,
    amount: params.amountTouched || params.currentForm.amount ? params.currentForm.amount : String(selectedPackage.total_amount),
    customer_name: params.currentForm.customer_name || member?.name || ""
  };
}
