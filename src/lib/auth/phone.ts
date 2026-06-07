export function normalizeChinaPhone(input: string) {
  const compact = input.trim().replace(/[\s-]/g, "");
  if (compact.startsWith("+86")) return `+86${compact.slice(3)}`;
  if (compact.startsWith("86")) return `+86${compact.slice(2)}`;
  return `+86${compact}`;
}

export function isValidChinaPhone(input: string) {
  const normalized = normalizeChinaPhone(input);
  const body = normalized.startsWith("+86") ? normalized.slice(3) : normalized;
  return /^1[3-9]\d{9}$/.test(body);
}

export function toSupabasePhone(input: string) {
  const normalized = normalizeChinaPhone(input);
  if (!isValidChinaPhone(normalized)) {
    throw new Error("请输入正确的手机号");
  }
  return normalized;
}
