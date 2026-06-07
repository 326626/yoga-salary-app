import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("auth UI safety", () => {
  it("does not expose phone password auth actions in the main auth form", () => {
    const content = readFileSync(join(process.cwd(), "src/components/auth-form.tsx"), "utf8");
    expect(content).not.toContain("signInWithPhone");
    expect(content).not.toContain("signUpWithPhone");
    expect(content).toContain("手机号验证码登录即将支持");
  });

  it("keeps bottom tab navigation fixed to the viewport", () => {
    const content = readFileSync(join(process.cwd(), "src/components/bottom-tab-nav.tsx"), "utf8");
    expect(content).toContain("fixed bottom-0 left-1/2");
    expect(content).toContain("env(safe-area-inset-bottom)");
  });
});
