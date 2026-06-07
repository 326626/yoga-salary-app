import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "工资规则文本无效。" }, { status: 400 });
  }

  return NextResponse.json(
    { error: "工资规则识别入口已升级，请在工资规则页面使用新的规则助手。" },
    { status: 410 }
  );
}
