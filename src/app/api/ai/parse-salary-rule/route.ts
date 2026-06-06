import { NextResponse } from "next/server";

import { parseSalaryRuleText } from "@/lib/ai/parseSalaryRule";
import { parseSalaryRuleInputSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = parseSalaryRuleInputSchema.safeParse(body);

  if (!input.success) {
    return NextResponse.json({ error: "工资规则文本无效。" }, { status: 400 });
  }

  try {
    const parsedRule = await parseSalaryRuleText(input.data.text, undefined, {
      allowMockFallback: process.env.NODE_ENV !== "production"
    });
    return NextResponse.json({
      status: "pending_confirmation",
      data: parsedRule.structured_rule
    });
  } catch {
    return NextResponse.json({ error: "AI 解析失败，请稍后重试或手动录入。" }, { status: 500 });
  }
}
