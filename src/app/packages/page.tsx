import { PackagesManager } from "@/components/packages-manager";

export default function PackagesPage({ searchParams }: { searchParams?: { memberId?: string; editPackageId?: string; studioId?: string } }) {
  return <PackagesManager initialMemberId={searchParams?.memberId} initialEditId={searchParams?.editPackageId} initialStudioId={searchParams?.studioId} />;
}
