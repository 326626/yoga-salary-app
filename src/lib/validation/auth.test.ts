import { describe, expect, it } from "vitest";

import { loginInputSchema, signupInputSchema } from "./schemas";

describe("auth input schemas", () => {
  it("accepts valid email and password", () => {
    expect(loginInputSchema.safeParse({ email: "teacher@example.com", password: "123456" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(loginInputSchema.safeParse({ email: "not-email", password: "123456" }).success).toBe(false);
  });

  it("rejects short password", () => {
    expect(loginInputSchema.safeParse({ email: "teacher@example.com", password: "123" }).success).toBe(false);
  });

  it("rejects signup when confirmPassword does not match", () => {
    expect(
      signupInputSchema.safeParse({
        email: "teacher@example.com",
        password: "123456",
        confirmPassword: "abcdef"
      }).success
    ).toBe(false);
  });
});
