import { NextResponse } from "next/server";
import { z } from "zod";

import { DeepSeekConfigurationError } from "@/lib/ai/deepseek";
import { parseSalaryRuleText } from "@/lib/ai/parseSalaryRule";

const requestSchema = z.object({
  raw_text: z.string().trim().min(1).max(5000)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = requestSchema.safeParse(body);

  if (!input.success) {
    return NextResponse.json({ ok: false, message: "请先输入工资规则文本～" }, { status: 400 });
  }

  try {
    const parsed = await parseSalaryRuleText(input.data.raw_text, undefined, {
      allowMockFallback: process.env.NODE_ENV !== "production"
    });
    return NextResponse.json({
      ok: true,
      structured_rule: parsed.structured_rule,
      uncertain_items: parsed.structured_rule.uncertain_items,
      message: parsed.fallback ? parsed.message : undefined
    });
  } catch (error) {
    const message =
      error instanceof DeepSeekConfigurationError
        ? "还没有配置 AI Key，当前可以先使用示例识别～"
        : error instanceof Error
          ? error.message
          : "识别失败，请稍后再试，或手动调整规则～";
    return NextResponse.json({ ok: false, message });
  }
}
