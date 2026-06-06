import { SalaryRulesView } from "@/components/salary-rules-view";

export default function SalaryRulesPage({ searchParams }: { searchParams?: { studioId?: string } }) {
  return <SalaryRulesView initialStudioId={searchParams?.studioId} />;
}
