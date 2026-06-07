import { NextResponse } from "next/server";

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

  return NextResponse.json({ ok: false, message: "图片识别能力已预留，当前请先复制图片中的文字进行识别～" });
}
