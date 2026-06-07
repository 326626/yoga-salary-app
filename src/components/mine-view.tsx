"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Archive, Dumbbell, LogOut, MapPin, ReceiptText, Settings2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { createDefaultTeacher, listTeachers } from "@/lib/data";
import { signOut } from "@/lib/supabase/auth";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Teacher } from "@/types";

const links = [
  { href: "/studios", label: "瑜伽馆 / 工作地点", description: "按上课地点区分课程和工资", icon: MapPin },
  { href: "/organize", label: "整理未归属数据", description: "把旧记录分配到瑜伽馆", icon: Archive },
  { href: "/salary-history", label: "工资历史", description: "查看已保存的月度工资快照", icon: ReceiptText },
  { href: "/members", label: "会员管理", description: "查看会员和后续课包关联", icon: UserRound },
  { href: "/packages", label: "课包管理", description: "记录成交价、课时和单节价格", icon: Dumbbell },
  { href: "/salary-rules", label: "工资规则", description: "管理 active 工资规则", icon: Settings2 }
];

export function MineView() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setTeachers(await listTeachers(supabase, currentUser.id));
      }
      setLoading(false);
    });
  }, []);

  async function handleCreateDefaultTeacher() {
    if (!user) return;
    try {
      const supabase = createBrowserSupabaseClient();
      const teacher = await createDefaultTeacher(supabase, user.id);
      setTeachers((current) => [teacher, ...current]);
      setMessage("已创建我的兼容档案～");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后再试～");
    }
  }

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await signOut(supabase);
    setUser(null);
    setTeachers([]);
    router.refresh();
  }

  if (loading) {
    return <div className="rounded-3xl bg-card/80 p-5 text-sm text-muted-foreground">正在整理你的信息...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-normal">我的</h1>
        <p className="text-sm leading-6 text-muted-foreground">{user ? "你的课程、业绩和工资规则会同步保存。" : "登录后可以同步保存你的课程、业绩和工资规则～"}</p>
      </div>
      <Feedback message={message} tone={message.includes("失败") ? "error" : "success"} />
      {user ? (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div>
              <div className="text-sm text-muted-foreground">当前账号</div>
              <div className="mt-1 font-medium">{user.phone || user.email || "已登录"}</div>
            </div>
            {teachers.length === 0 ? (
              <div className="space-y-3 rounded-3xl bg-secondary/70 p-4">
                <p className="text-sm text-muted-foreground">还没有我的兼容档案，先创建后就能正常保存课程和工资快照。</p>
                <Button className="w-full" onClick={handleCreateDefaultTeacher}>创建我的档案</Button>
              </div>
            ) : null}
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" aria-hidden="true" />
              退出登录
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button asChild><Link href="/login">登录</Link></Button>
          <Button asChild variant="secondary"><Link href="/signup">注册</Link></Button>
        </div>
      )}
      <div className="space-y-3">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="flex min-h-16 items-center gap-3 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-primary">
              <item.icon className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block text-xs text-muted-foreground">{item.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
