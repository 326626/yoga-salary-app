import "server-only";

import { deepSeekProvider } from "./deepseek";
import { extractJsonObject } from "./json";
import type { SalaryRuleAiProvider, StructuredSalaryRuleParseResult } from "./provider";
import { mockParseSalaryRule } from "./mockParseSalaryRule";
import { structuredSalaryRuleSchema } from "@/lib/validation";

export class SalaryRuleParseError extends Error {
  constructor(message = "识别失败，请稍后再试，或手动调整规则～") {
    super(message);
    this.name = "SalaryRuleParseError";
  }
}

export function parseAndValidateStructuredSalaryRule(rawAiText: string) {
  const parsed = extractJsonObject(rawAiText);
  const validation = structuredSalaryRuleSchema.safeParse(parsed);
  if (!validation.success) {
    throw new SalaryRuleParseError("规则有点复杂，我没完全识别出来，你可以手动调整一下～");
  }
  return validation.data;
}

export async function parseSalaryRuleText(
  rawText: string,
  provider: SalaryRuleAiProvider = deepSeekProvider,
  options: { allowMockFallback?: boolean } = {}
): Promise<StructuredSalaryRuleParseResult> {
  try {
    const result = await provider.parseSalaryRuleFromText({ rawText });
    const structuredRule = result.raw_ai_text ? parseAndValidateStructuredSalaryRule(result.raw_ai_text) : structuredSalaryRuleSchema.parse(result.structured_rule);
    return {
      structured_rule: structuredRule,
      raw_ai_text: result.raw_ai_text,
      uncertain_items: undefined
    } as StructuredSalaryRuleParseResult;
  } catch (error) {
    if (options.allowMockFallback) {
      const fallbackRule = structuredSalaryRuleSchema.parse(mockParseSalaryRule(rawText));
      return {
        structured_rule: fallbackRule,
        fallback: true,
        message: error instanceof Error ? error.message : "还没有配置 AI Key，当前可以先使用示例识别～"
      };
    }
    if (error instanceof Error) {
      throw new SalaryRuleParseError(error.message);
    }
    throw new SalaryRuleParseError();
  }
}
