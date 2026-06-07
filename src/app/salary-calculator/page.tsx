import { SalaryCalculatorView } from "@/components/salary-calculator-view";

export default function SalaryCalculatorPage({ searchParams }: { searchParams?: { studioId?: string; month?: string } }) {
  return <SalaryCalculatorView initialStudioId={searchParams?.studioId} initialMonth={searchParams?.month} />;
}
