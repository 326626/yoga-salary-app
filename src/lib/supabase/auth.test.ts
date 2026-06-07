import { describe, expect, it } from "vitest";

import { signInWithEmail, signUpWithEmail } from "./auth";

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

});
