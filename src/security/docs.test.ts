import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const docs = [
  "docs/mobile-qa-checklist.md",
  "docs/smoke-test.md",
  "docs/deployment-troubleshooting.md"
];

describe("deployment documentation", () => {
  it("keeps deployment and QA docs available", () => {
    for (const doc of docs) {
      expect(existsSync(join(process.cwd(), doc))).toBe(true);
    }
  });

  it("documents Vercel and Supabase production setup in README", () => {
    const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");
    expect(readme).toContain("Vercel 部署");
    expect(readme).toContain("Supabase Auth 生产配置");
    expect(readme).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(readme).toContain("DEEPSEEK_API_KEY");
  });
});
