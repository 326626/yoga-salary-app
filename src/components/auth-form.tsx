"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail, signUpWithEmail } from "@/lib/supabase/auth";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loginInputSchema, signupInputSchema } from "@/lib/validation";

type AuthMode = "login" | "signup";
type AuthErrors = Partial<Record<"email" | "password" | "confirmPassword", string>>;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLogin = mode === "login";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const schema = isLogin ? loginInputSchema : signupInputSchema;
    const result = schema.safeParse(isLogin ? { email, password } : { email, password, confirmPassword });

    if (!result.success) {
      setErrors(toFieldErrors(result.error));
      return;
    }

    setErrors({});
    if (!isSupabaseConfigured()) {
      setMessage("还没有连接云端服务，请先配置 Supabase 环境变量～");
      return;
    }
    setIsSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      if (isLogin) {
        await signInWithEmail(supabase, email, password);
        router.push("/mine");
        router.refresh();
      } else {
        await signUpWithEmail(supabase, email, password);
        setMessage("注册成功啦，可以用邮箱和密码登录～");
      }
    } catch (error) {
      const friendlyMessage = error instanceof Error && (error.message.includes("邮箱") || error.message.includes("注册"))
        ? error.message
        : "网络好像开小差了，请再试一次～";
      setMessage(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{isLogin ? "欢迎回来" : "先创建一个小小账号"}</p>
        <h1 className="text-2xl font-semibold tracking-normal">{isLogin ? "登录" : "注册"}</h1>
      </div>
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="size-5 text-primary" aria-hidden="true" />
            {isLogin ? "同步保存你的记录" : "以后每次打开都能接着用"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Feedback message={message} tone={message.includes("成功") ? "success" : "error"} />
            <Field label="邮箱" error={errors.email}>
              <Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="密码" error={errors.password}>
              <Input type="password" autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" />
            </Field>
            {!isLogin ? (
              <Field label="确认密码" error={errors.confirmPassword}>
                <Input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再输入一次密码" />
              </Field>
            ) : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "处理中..." : isLogin ? "登录" : "注册"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? (
              <>
                还没有账号？<Link className="font-medium text-primary" href="/signup">去注册</Link>
              </>
            ) : (
              <>
                已经有账号？<Link className="font-medium text-primary" href="/login">去登录</Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function toFieldErrors(error: z.ZodError): AuthErrors {
  const errors: AuthErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof AuthErrors;
    errors[field] = issue.message;
  }
  return errors;
}
