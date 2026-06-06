import { NextResponse } from "next/server";

import { validateSalaryRuleImageFile } from "@/lib/ai/imageValidation";
import { unsupportedVisionProvider, VisionProviderNotSupportedError } from "@/lib/ai/visionProvider";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const fileValue = formData?.get("image");
  const file = fileValue instanceof File ? fileValue : null;
  const validation = validateSalaryRuleImageFile(file);

  if (!validation.ok) {
    return NextResponse.json({ ok: false, message: validation.message }, { status: 400 });
  }

  try {
    await unsupportedVisionProvider.parseSalaryRuleFromImage({ file: validation.file });
    return NextResponse.json({ ok: false, message: "图片识别能力已预留，当前请先复制图片中的文字进行识别～" });
  } catch (error) {
    const message =
      error instanceof VisionProviderNotSupportedError
        ? error.message
        : "这张图片暂时识别不了，可以先复制文字试试～";
    return NextResponse.json({ ok: false, message });
  }
}
