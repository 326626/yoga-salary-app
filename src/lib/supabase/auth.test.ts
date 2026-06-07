import { describe, expect, it } from "vitest";

import { signInWithEmail, signInWithPhone, signUpWithEmail, signUpWithPhone } from "./auth";

describe("Supabase auth helpers", () => {
  it("returns signup data so UI can detect email confirmation requirement", async () => {
    const supabase = {
      auth: {
        signUp() {
          return { data: { user: { id: "user-id" }, session: null }, error: null };
        }
      }
    };

    const data = await signUpWithEmail(supabase as never, "teacher@example.com", "123456");
    expect(data.session).toBeNull();
  });

  it("maps email invalid credentials to confirmation-aware message", async () => {
    const supabase = {
      auth: {
        signInWithPassword() {
          return { data: null, error: { message: "Invalid login credentials" } };
        }
      }
    };

    await expect(signInWithEmail(supabase as never, "teacher@example.com", "bad-password")).rejects.toThrow("邮箱或密码不正确，或者邮箱还没有确认～");
  });

  it("signs in with normalized phone and password", async () => {
    let payload: unknown = null;
    const supabase = {
      auth: {
        signInWithPassword(input: unknown) {
          payload = input;
          return { data: { user: { id: "user-id" } }, error: null };
        }
      }
    };

    await signInWithPhone(supabase as never, "138 0013 8000", "123456");
    expect(payload).toEqual({ phone: "+8613800138000", password: "123456" });
  });

  it("maps unavailable phone signup to friendly message", async () => {
    const supabase = {
      auth: {
        signUp() {
          return { data: null, error: { message: "Phone provider disabled" } };
        }
      }
    };

    await expect(signUpWithPhone(supabase as never, "13800138000", "123456")).rejects.toThrow("当前手机号注册暂不可用，可以先使用邮箱注册～");
  });
});
