import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawText = typeof body?.raw_text === "string" ? body.raw_text.trim() : "";

  if (!rawText) {
    return NextResponse.json({ ok: false, message: "请先输入工资规则文本～" }, { status: 400 });
  }

  return NextResponse.json({
    ok: false,
    message: "工资规则识别入口已升级，请在工资规则页面使用新的规则助手～"
  });
}
