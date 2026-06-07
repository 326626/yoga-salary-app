"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Heart } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signInWithEmail, signInWithPhone, signUpWithEmail, signUpWithPhone } from "@/lib/supabase/auth";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { authLoginInputSchema, authSignupInputSchema } from "@/lib/validation";

type AuthMode = "login" | "signup";
type AuthMethod = "email" | "phone";
type AuthErrors = Partial<Record<"email" | "phone" | "password" | "confirmPassword", string>>;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [method, setMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({});
  const [message, setMessage] = useState("");
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLogin = mode === "login";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setNeedsEmailConfirmation(false);
    const schema = isLogin ? authLoginInputSchema : authSignupInputSchema;
    const payload = method === "email"
      ? isLogin ? { method, email, password } : { method, email, password, confirmPassword }
      : isLogin ? { method, phone, password } : { method, phone, password, confirmPassword };
    const result = schema.safeParse(payload);

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
        if (method === "email") {
          await signInWithEmail(supabase, email, password);
        } else {
          await signInWithPhone(supabase, phone, password);
        }
        router.push("/mine");
        router.refresh();
      } else {
        if (method === "email") {
          const data = await signUpWithEmail(supabase, email, password);
          if (data.session) {
            setMessage("注册成功啦，已经为你登录～");
            router.push("/mine");
            router.refresh();
          } else {
            setNeedsEmailConfirmation(true);
            setMessage("注册邮件已经发出啦～");
          }
        } else {
          await signUpWithPhone(supabase, phone, password);
          setMessage("手机号注册成功啦，可以登录使用～");
        }
      }
    } catch (error) {
      const friendlyMessage = error instanceof Error && (error.message.includes("邮箱") || error.message.includes("注册") || error.message.includes("手机号"))
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
      {needsEmailConfirmation ? (
        <Card className="bg-gradient-to-br from-secondary via-card to-accent">
          <CardContent className="space-y-4 p-5">
            <CheckCircle2 className="size-7 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold">注册邮件已经发出啦～</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">请打开邮箱，点击确认链接后再回来登录。</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">如果没有看到邮件，可以检查垃圾邮件或稍等一会儿。</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/login">去登录</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="size-5 text-primary" aria-hidden="true" />
            {isLogin ? (method === "email" ? "用邮箱登录" : "用手机号登录") : method === "email" ? "用邮箱注册" : "用手机号注册"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Feedback message={message} tone={message.includes("成功") || message.includes("发出") ? "success" : "error"} />
            <div className="grid grid-cols-2 rounded-2xl bg-muted p-1">
              <button type="button" className={cn("min-h-11 rounded-xl text-sm font-medium", method === "email" && "bg-card text-primary shadow-sm")} onClick={() => { setMethod("email"); setErrors({}); setMessage(""); }}>
                邮箱
              </button>
              <button type="button" className={cn("min-h-11 rounded-xl text-sm font-medium", method === "phone" && "bg-card text-primary shadow-sm")} onClick={() => { setMethod("phone"); setErrors({}); setMessage(""); }}>
                手机号
              </button>
            </div>
            {method === "email" ? (
              <Field label="邮箱" error={errors.email}>
                <Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </Field>
            ) : (
              <Field label="手机号" error={errors.phone}>
                <Input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="13800138000" />
              </Field>
            )}
            <Field label="密码" error={errors.password}>
              <Input type="password" autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" />
            </Field>
            {!isLogin ? (
              <Field label="确认密码" error={errors.confirmPassword}>
                <Input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再输入一次密码" />
              </Field>
            ) : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "处理中..." : isLogin ? (method === "email" ? "用邮箱登录" : "用手机号登录") : method === "email" ? "用邮箱注册" : "用手机号注册"}
            </Button>
            {isLogin && method === "email" ? <p className="text-xs leading-5 text-muted-foreground">如果刚刚注册，请先去邮箱点击确认链接。</p> : null}
            {method === "phone" ? <p className="text-xs leading-5 text-muted-foreground">本阶段使用手机号 + 密码，不使用短信验证码。若暂不可用，可以先用邮箱注册～</p> : null}
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
