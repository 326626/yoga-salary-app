export const MAX_SALARY_RULE_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_SALARY_RULE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ImageValidationResult =
  | { ok: true; file: File }
  | { ok: false; message: string };

export function validateSalaryRuleImageFile(file: File | null | undefined): ImageValidationResult {
  if (!file) {
    return { ok: false, message: "请先选择一张图片～" };
  }
  if (!ALLOWED_SALARY_RULE_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_SALARY_RULE_IMAGE_TYPES)[number])) {
    return { ok: false, message: "图片格式暂时只支持 JPG、PNG 或 WEBP～" };
  }
  if (file.size > MAX_SALARY_RULE_IMAGE_SIZE) {
    return { ok: false, message: "图片最大支持 5MB，可以压缩后再试试～" };
  }
  return { ok: true, file };
}
