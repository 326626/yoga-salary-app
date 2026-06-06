import { SalaryCalculatorView } from "@/components/salary-calculator-view";

export default function SalaryCalculatorPage({ searchParams }: { searchParams?: { studioId?: string } }) {
  return <SalaryCalculatorView initialStudioId={searchParams?.studioId} />;
}
