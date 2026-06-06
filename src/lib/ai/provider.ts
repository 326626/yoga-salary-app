import type { StructuredSalaryRule } from "@/types";

export type StructuredSalaryRuleParseResult = {
  structured_rule: StructuredSalaryRule;
  raw_ai_text?: string;
  message?: string;
  fallback?: boolean;
};

export type ParseSalaryRuleTextInput = {
  rawText: string;
};

export type ParseSalaryRuleImageInput = {
  file: File;
};

export type SalaryRuleAiProvider = {
  name: string;
  parseSalaryRuleFromText(input: ParseSalaryRuleTextInput): Promise<StructuredSalaryRuleParseResult>;
  parseSalaryRuleFromImage?(input: ParseSalaryRuleImageInput): Promise<StructuredSalaryRuleParseResult>;
};

export type AiProvider = SalaryRuleAiProvider;
