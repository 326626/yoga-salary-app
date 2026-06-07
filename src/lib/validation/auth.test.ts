import { describe, expect, it } from "vitest";

import { authLoginInputSchema, authSignupInputSchema, loginInputSchema, signupInputSchema } from "./schemas";

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

  it("accepts valid email auth mode input", () => {
    expect(authLoginInputSchema.safeParse({ method: "email", email: "teacher@example.com", password: "123456" }).success).toBe(true);
  });

  it("accepts valid phone auth mode input", () => {
    expect(authLoginInputSchema.safeParse({ method: "phone", phone: "13800138000", password: "123456" }).success).toBe(true);
  });

  it("rejects invalid phone auth mode input", () => {
    expect(authLoginInputSchema.safeParse({ method: "phone", phone: "12800138000", password: "123456" }).success).toBe(false);
  });

  it("rejects auth signup when confirmPassword does not match", () => {
    expect(
      authSignupInputSchema.safeParse({
        method: "phone",
        phone: "13800138000",
        password: "123456",
        confirmPassword: "abcdef"
      }).success
    ).toBe(false);
  });
});
