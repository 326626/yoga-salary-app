import { QuickPerformanceForm } from "@/components/quick-performance-form";

export default function PerformancesPage({ searchParams }: { searchParams?: { studioId?: string } }) {
  return <QuickPerformanceForm initialStudioId={searchParams?.studioId} />;
}
