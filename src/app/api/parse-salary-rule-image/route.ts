import { NextResponse } from "next/server";

import { parseRuleDocuments } from "@/lib/ai/documentParser";
import { parseRuleConversation } from "@/lib/ai/ruleConversation";

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const fileValue = formData?.get("image");
  const file = fileValue instanceof File ? fileValue : null;

  if (!file) {
    return NextResponse.json({ ok: false, message: "请先选择一张图片～" }, { status: 400 });
  }
  if (!allowedImageTypes.has(file.type)) {
    return NextResponse.json({ ok: false, message: "图片格式暂时只支持 JPG、PNG 或 WEBP～" }, { status: 400 });
  }
  if (file.size > maxImageSize) {
    return NextResponse.json({ ok: false, message: "图片最大支持 5MB，可以压缩后再试试～" }, { status: 400 });
  }

  try {
    const documents = await parseRuleDocuments([file]);
    const images = documents.documents
      .filter((item) => item.imageDataUrl)
      .map((item) => ({
        fileName: item.fileName,
        mimeType: item.fileType,
        dataUrl: item.imageDataUrl ?? ""
      }));
    const result = await parseRuleConversation({ images });
    return NextResponse.json({
      ok: true,
      structured_rule: result.structured_rule,
      uncertain_items: result.uncertain_items,
      assistant_message: result.assistant_message,
      message: result.message
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "当前模型暂时没有成功识别图片，可以把图片里的文字发给我，我继续帮你整理～";
    return NextResponse.json({ ok: false, message });
  }
}
