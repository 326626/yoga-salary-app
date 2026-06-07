import "server-only";

import { structuredSalaryRuleSchema } from "@/lib/validation";
import type { StructuredSalaryRule } from "@/types";

import { parseSalaryRuleText } from "./parseSalaryRule";

export type RuleConversationInput = {
  rawText?: string;
  supplementalMessage?: string;
  extractedTexts?: string[];
  previousStructuredRule?: StructuredSalaryRule | null;
};

export function buildRuleConversationText(input: RuleConversationInput) {
  const parts = [
    input.previousStructuredRule ? `上一版结构化规则 JSON：\n${JSON.stringify(input.previousStructuredRule)}` : "",
    input.rawText ? `用户输入的规则：\n${input.rawText}` : "",
    input.supplementalMessage ? `用户补充或修正：\n${input.supplementalMessage}` : "",
    input.extractedTexts?.length ? `附件中提取到的文字：\n${input.extractedTexts.filter(Boolean).join("\n\n")}` : ""
  ].filter(Boolean);

  return parts.join("\n\n---\n\n");
}

export async function parseRuleConversation(input: RuleConversationInput) {
  const text = buildRuleConversationText(input).trim();
  if (!text) {
    throw new Error("请先输入工资规则或上传可识别的文本文件～");
  }

  const parsed = await parseSalaryRuleText(text, undefined, {
    allowMockFallback: process.env.NODE_ENV !== "production"
  });
  const validation = structuredSalaryRuleSchema.safeParse(parsed.structured_rule);
  if (!validation.success) {
    throw new Error("规则有点复杂，可以手动调整一下～");
  }

  return {
    structured_rule: validation.data,
    uncertain_items: validation.data.uncertain_items,
    assistant_message: "我整理出了一版规则草稿～",
    message: parsed.message
  };
}
