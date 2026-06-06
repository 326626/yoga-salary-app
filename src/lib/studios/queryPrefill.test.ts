import { describe, expect, it } from "vitest";

import { mockStudios } from "@/lib/mock-data";

import { resolveStudioQueryPrefill } from "./queryPrefill";

describe("resolveStudioQueryPrefill", () => {
  it("uses valid studioId", () => {
    expect(resolveStudioQueryPrefill(mockStudios, { studioId: mockStudios[0].id })).toBe(mockStudios[0].id);
  });

  it("ignores invalid studioId", () => {
    expect(resolveStudioQueryPrefill(mockStudios, { studioId: "not-owned" })).toBe("");
  });

  it("does not use query user_id", () => {
    expect(resolveStudioQueryPrefill(mockStudios, { user_id: "99999999-9999-4999-8999-999999999999" })).toBe("");
  });
});
