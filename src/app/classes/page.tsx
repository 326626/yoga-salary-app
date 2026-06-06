import { QuickClassForm } from "@/components/quick-class-form";
import type { ClassPrefillQuery } from "@/lib/classPrefill";

export default function ClassesPage({ searchParams }: { searchParams?: ClassPrefillQuery }) {
  return <QuickClassForm initialQuery={searchParams ?? {}} />;
}
