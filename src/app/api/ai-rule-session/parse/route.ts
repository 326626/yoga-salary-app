import { NextResponse } from "next/server";

import { parseRuleDocuments } from "@/lib/ai/documentParser";
import { parseRuleConversation } from "@/lib/ai/ruleConversation";
import { structuredSalaryRuleSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ ok: false, message: "请求内容不太对，请再试一次～" }, { status: 400 });
  }

  const rawText = String(formData.get("raw_text") ?? "");
  const supplementalMessage = String(formData.get("supplemental_message") ?? "");
  const previousRaw = String(formData.get("previous_structured_rule") ?? "");
  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);

  let previousStructuredRule = null;
  if (previousRaw) {
    try {
      const parsedPrevious = JSON.parse(previousRaw);
      const validation = structuredSalaryRuleSchema.safeParse(parsedPrevious);
      if (!validation.success) {
        return NextResponse.json({ ok: false, message: "上一版规则格式不太对，请先校验 JSON～" }, { status: 400 });
      }
      previousStructuredRule = validation.data;
    } catch {
      return NextResponse.json({ ok: false, message: "上一版规则格式不太对，请先校验 JSON～" }, { status: 400 });
    }
  }

  try {
    const documents = await parseRuleDocuments(files);
    const extractedTexts = documents.documents.map((item) => item.extractedText).filter(Boolean);
    const hasTextInput = rawText.trim() || supplementalMessage.trim() || previousStructuredRule || extractedTexts.length > 0;
    if (!hasTextInput && documents.messages[0]) {
      return NextResponse.json({
        ok: false,
        message: documents.messages[0],
        assistant_message: documents.messages[0]
      });
    }

    const result = await parseRuleConversation({
      rawText,
      supplementalMessage,
      extractedTexts,
      previousStructuredRule
    });
    return NextResponse.json({
      ok: true,
      structured_rule: result.structured_rule,
      uncertain_items: result.uncertain_items,
      assistant_message: documents.messages[0] ?? result.assistant_message,
      message: result.message
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "规则有点复杂，可以手动调整一下～";
    return NextResponse.json({ ok: false, message });
  }
}
