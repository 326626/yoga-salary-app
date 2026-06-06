import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function listFiles(dir: string): string[] {
  return readdirSync(join(process.cwd(), dir), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return listFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

const frontendFiles = [...listFiles("src/app"), ...listFiles("src/components")].filter((file) => !file.includes("/api/"));

describe("client environment safety", () => {
  it("does not reference DEEPSEEK_API_KEY from page or component code", () => {
    for (const file of frontendFiles) {
      const content = readFileSync(join(process.cwd(), file), "utf8");
      expect(content).not.toContain("DEEPSEEK_API_KEY");
    }
  });

  it("does not contain Supabase service role or secret key references", () => {
    const files = [...listFiles("src").filter((file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx")), "README.md", "supabase/schema.sql"];
    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), "utf8");
      expect(content).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(content).not.toContain("SUPABASE_SECRET_KEY");
      expect(content).not.toContain("sb_secret");
    }
  });

  it("does not call DeepSeek directly from frontend code", () => {
    for (const file of frontendFiles) {
      const content = readFileSync(join(process.cwd(), file), "utf8");
      expect(content).not.toContain("api.deepseek.com");
    }
  });

  it("does not leave console logging in app source", () => {
    const files = listFiles("src").filter((file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"));
    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), "utf8");
      expect(content).not.toContain("console.log");
    }
  });
});
