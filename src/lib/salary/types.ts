type SalaryCourseType = "group" | "private" | "trial" | "substitute" | "other";

export type FixedPerClassRule = {
  course_type: SalaryCourseType;
  fee_type: "fixed_per_class";
  amount: number;
};

export type FixedPerHourRule = {
  course_type: SalaryCourseType;
  fee_type: "fixed_per_hour";
  amount: number;
};

export type PercentageOfUnitPriceRule = {
  course_type: SalaryCourseType;
  fee_type: "percentage_of_unit_price";
  rate: number;
};

export type NoClassFeeRule = {
  course_type: SalaryCourseType;
  fee_type: "none";
  amount: 0;
};

export type ClassFeeRule =
  | FixedPerClassRule
  | FixedPerHourRule
  | PercentageOfUnitPriceRule
  | NoClassFeeRule;

export type CommissionRule = {
  min_amount: number;
  max_amount: number | null;
  rate: number;
};

export type StructuredSalaryRule = {
  class_fee_rules: ClassFeeRule[];
  commission_rules: CommissionRule[];
  commission_mode: "tiered" | "full_amount_rate" | "unknown";
  bonus_rules: unknown[];
  deduction_rules: unknown[];
  uncertain_items: string[];
};

export type SalaryCalculationBreakdown = {
  classFees: unknown[];
  commissions: unknown[];
  warnings: string[];
};
