"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { BookOpenCheck, Building2, Dumbbell, ReceiptText, Settings2, UserRound, WalletCards } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listClasses, listPackageItems, listPackages, listPerformances, listSalaryCalculations, listSalaryRules, listTeachers } from "@/lib/data";
import { mockClasses, mockPackages, mockPerformances, mockSalaryCalculations, mockSalaryRules, mockTeachers } from "@/lib/mock-data";
import { buildHomeMonthOverview, type HomeMonthOverview } from "@/lib/home/monthOverview";
import { formatMoney } from "@/lib/salary/formatMoney";
import { selectSalaryRule } from "@/lib/salary/selectSalaryRule";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

const quickActions = [
  { href: "/classes", label: "记一节课", icon: BookOpenCheck },
  { href: "/performances", label: "记一笔业绩", icon: WalletCards },
  { href: "/salary-calculator", label: "查看本月工资", icon: ReceiptText }
];

const commonActions = [
  { href: "/members", label: "会员", icon: UserRound },
  { href: "/packages", label: "课包", icon: Dumbbell },
  { href: "/salary-rules", label: "工资规则", icon: Settings2 },
  { href: "/studios", label: "瑜伽馆", icon: Building2 }
];

const currentMonth = () => new Date().toISOString().slice(0, 7);

function demoOverview(month: string) {
  return buildHomeMonthOverview({
    loggedIn: false,
    month,
    teachers: mockTeachers,
    classes: mockClasses,
    performances: mockPerformances,
    packages: mockPackages,
    activeSalaryRule: mockSalaryRules.find((item) => item.active) ?? null,
    salaryCalculations: mockSalaryCalculations
  });
}

export function HomePageClient() {
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<HomeMonthOverview>(() => demoOverview(currentMonth()));
  const [message, setMessage] = useState("登录后可以查看你的真实本月概览～");

  useEffect(() => {
    const month = currentMonth();
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setOverview(demoOverview(month));
        setMessage("登录后可以查看你的真实本月概览～");
        return;
      }
      const [teachers, classes, performances, packages, packageItems, salaryRules, salaryCalculations] = await Promise.all([
        listTeachers(supabase, currentUser.id),
        listClasses(supabase, currentUser.id),
        listPerformances(supabase, currentUser.id),
        listPackages(supabase, currentUser.id),
        listPackageItems(supabase, currentUser.id),
        listSalaryRules(supabase, currentUser.id),
        listSalaryCalculations(supabase, currentUser.id)
      ]);
      const selectedRule = selectSalaryRule(salaryRules);
      const next = buildHomeMonthOverview({
        loggedIn: true,
        month,
        teachers,
        classes,
        performances,
        packages,
        packageItems,
        activeSalaryRule: selectedRule.rule,
        salaryCalculations
      });
      setOverview(next);
      setMessage(next.message);
    }).catch(() => {
      setMessage("网络好像开小差了，本月概览暂时没有更新～");
    });
  }, []);

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">今天也稳稳记一笔</p>
        <h1 className="text-3xl font-semibold tracking-normal">瑜伽工资助手</h1>
      </section>

      <section className="grid gap-3">
        {quickActions.map((item) => (
          <Link key={item.href} href={item.href} className="flex min-h-14 items-center justify-between rounded-lg border bg-card px-4 text-sm font-medium shadow-sm transition-colors hover:bg-secondary">
            <span className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <item.icon className="size-5" aria-hidden="true" />
              </span>
              {item.label}
            </span>
            <span className="text-muted-foreground">进入</span>
          </Link>
        ))}
      </section>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg">本月概览</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          {message ? <p className="rounded-3xl bg-secondary/70 p-3 text-sm text-muted-foreground">{message}</p> : null}
          <div className="grid grid-cols-2 gap-3">
            <OverviewPill label="课程数" value={`${overview.classCount}`} />
            <OverviewPill label="计提业绩" value={`¥${formatMoney(overview.performanceTotal)}`} />
            <OverviewPill label="预计工资" value={overview.estimatedSalary === null ? "待设置" : `¥${formatMoney(overview.estimatedSalary)}`} />
            <OverviewPill label="工资快照" value={overview.snapshotCount > 0 ? `${overview.snapshotCount} 个` : "未保存"} />
          </div>
          {!user ? <Link href="/login" className="block rounded-2xl bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground">登录查看真实数据</Link> : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">常用功能</h2>
        <div className="grid grid-cols-2 gap-3">
          {commonActions.map((item) => (
            <Link key={item.href} href={item.href} className="flex min-h-20 flex-col justify-between rounded-lg border bg-card p-4 shadow-sm">
              <item.icon className="size-5 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function OverviewPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-secondary p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
