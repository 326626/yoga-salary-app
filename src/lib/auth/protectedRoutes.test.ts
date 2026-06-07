import { describe, expect, it } from "vitest";

import { buildLoginRedirect, isProtectedRoute } from "./protectedRoutes";

describe("protected routes", () => {
  it("protects personal business pages", () => {
    expect(isProtectedRoute("/classes")).toBe(true);
    expect(isProtectedRoute("/packages/abc")).toBe(true);
    expect(isProtectedRoute("/salary-calculator")).toBe(true);
  });

  it("allows public pages", () => {
    expect(isProtectedRoute("/")).toBe(false);
    expect(isProtectedRoute("/login")).toBe(false);
    expect(isProtectedRoute("/signup")).toBe(false);
    expect(isProtectedRoute("/mine")).toBe(false);
  });

  it("builds login redirect with next parameter", () => {
    expect(buildLoginRedirect("/packages", "?studioId=studio-1")).toBe("/login?next=%2Fpackages%3FstudioId%3Dstudio-1");
  });
});
