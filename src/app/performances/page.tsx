import { QuickPerformanceForm } from "@/components/quick-performance-form";

export default function PerformancesPage({ searchParams }: { searchParams?: { studioId?: string; memberId?: string; packageId?: string } }) {
  return <QuickPerformanceForm initialStudioId={searchParams?.studioId} initialMemberId={searchParams?.memberId} initialPackageId={searchParams?.packageId} />;
}
