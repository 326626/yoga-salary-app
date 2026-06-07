import type { SalaryCalculationBreakdown, StructuredSalaryRule } from "@/lib/salary/types";

export type CourseType = "group" | "private" | "trial" | "substitute" | "other";

export type PerformanceType = "new_card" | "renewal" | "private_package" | "product" | "other";

export type SalaryRuleSourceType = "manual" | "image_ai";
export type SalaryCalculationStatus = "unsettled" | "settled";

export type Teacher = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  note: string | null;
  created_at: string;
};

export type Studio = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  contact_name: string | null;
  note: string | null;
  created_at: string;
};

export type Member = {
  id: string;
  user_id: string;
  studio_id: string | null;
  name: string;
  phone: string | null;
  note: string | null;
  created_at: string;
};

export type MemberPackage = {
  id: string;
  user_id: string;
  member_id: string;
  teacher_id: string | null;
  studio_id: string | null;
  package_name: string;
  course_type: CourseType;
  total_amount: number;
  total_sessions: number;
  unit_price: number;
  purchase_date: string;
  note: string | null;
  created_at: string;
};

export type ClassRecord = {
  id: string;
  user_id: string;
  teacher_id: string;
  studio_id: string | null;
  member_id: string | null;
  package_id: string | null;
  date: string;
  course_name: string;
  course_type: CourseType;
  student_count: number;
  hours: number;
  manual_fee: number | null;
  note: string | null;
  created_at: string;
};

export type Performance = {
  id: string;
  user_id: string;
  teacher_id: string;
  studio_id: string | null;
  member_id: string | null;
  package_id: string | null;
  date: string;
  customer_name: string | null;
  type: PerformanceType;
  amount: number;
  commissionable: boolean;
  note: string | null;
  created_at: string;
};

export type SalaryRule = {
  id: string;
  user_id: string;
  teacher_id: string | null;
  studio_id: string | null;
  name: string;
  raw_text: string;
  structured_rule: StructuredSalaryRule;
  source_type: SalaryRuleSourceType;
  active: boolean;
  created_at: string;
};

export type SalaryCalculation = {
  id: string;
  user_id: string;
  teacher_id: string;
  studio_id: string | null;
  month: string;
  class_fee_total: number;
  performance_total: number;
  commission_total: number;
  bonus_total: number;
  deduction_total: number;
  salary_total: number;
  breakdown: SalaryCalculationBreakdown;
  status: SalaryCalculationStatus;
  actual_paid_amount: number | null;
  settled_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type {
  ClassFeeRule,
  CommissionRule,
  SalaryCalculationBreakdown,
  StructuredSalaryRule
} from "@/lib/salary/types";
