import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(join(process.cwd(), "supabase/schema.sql"), "utf8");
const tables = [
  "teachers",
  "studios",
  "members",
  "packages",
  "classes",
  "performances",
  "salary_rules",
  "salary_calculations"
];

describe("Supabase schema integrity", () => {
  it("keeps all MVP business tables with user_id and RLS", () => {
    for (const table of tables) {
      expect(schema).toContain(`create table if not exists public.${table}`);
      expect(schema).toMatch(new RegExp(`create table if not exists public\\.${table} \\([\\s\\S]*?user_id uuid not null`));
      expect(schema).toContain(`alter table public.${table} enable row level security;`);
      expect(schema).toContain(`create policy "${table}_select_own"`);
      expect(schema).toContain(`create policy "${table}_insert_own"`);
      expect(schema).toContain(`create policy "${table}_update_own"`);
      expect(schema).toContain(`create policy "${table}_delete_own"`);
    }
  });

  it("includes studio ownership fields on related tables", () => {
    for (const table of ["members", "packages", "classes", "performances", "salary_rules", "salary_calculations"]) {
      expect(schema).toMatch(new RegExp(`create table if not exists public\\.${table} \\([\\s\\S]*?studio_id uuid references public\\.studios\\(id\\)`));
    }
  });

  it("includes salary snapshot settlement fields and checks", () => {
    for (const field of ["status text not null default 'unsettled'", "actual_paid_amount numeric", "settled_at date", "note text", "updated_at timestamptz default now()"]) {
      expect(schema).toContain(field);
    }
    expect(schema).toContain("salary_calculations_status_valid");
    expect(schema).toContain("salary_calculations_actual_paid_amount_nonnegative");
  });
});
