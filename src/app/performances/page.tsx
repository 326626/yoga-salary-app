import { QuickPerformanceForm } from "@/components/quick-performance-form";
import type { CommissionableFilter } from "@/lib/records/recordFilters";

export default function PerformancesPage({ searchParams }: { searchParams?: { studioId?: string; memberId?: string; packageId?: string; month?: string; commissionable?: CommissionableFilter } }) {
  return <QuickPerformanceForm initialStudioId={searchParams?.studioId} initialMemberId={searchParams?.memberId} initialPackageId={searchParams?.packageId} initialMonth={searchParams?.month} initialCommissionable={searchParams?.commissionable} />;
}
