"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { BookOpenCheck, Building2, Dumbbell, ReceiptText, Settings2, WalletCards } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { listClasses, listPackageItems, listPackages, listPerformances, listSalaryCalculations, listSalaryRules, listStudios, listTeachers } from "@/lib/data";
import { buildHomeMonthOverview, type HomeMonthOverview } from "@/lib/home/monthOverview";
import { calculatePackageUsageFromClasses } from "@/lib/data/packageUsage";
import { formatMoney } from "@/lib/salary/formatMoney";
import { selectSalaryRule } from "@/lib/salary/selectSalaryRule";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ClassRecord, MemberPackage, PackageItem, Performance, SalaryCalculation, SalaryRule, Studio, Teacher } from "@/types";

const currentMonth = () => new Date().toISOString().slice(0, 7);

const emptyOverview = (month: string): HomeMonthOverview => buildHomeMonthOverview({
  loggedIn: false,
  month,
  teachers: [],
  classes: [],
  performances: [],
  packages: [],
  packageItems: [],
  activeSalaryRule: null,
  salaryCalculations: []
});

const quickActions = [
  { href: "/classes", label: "记一节课", icon: BookOpenCheck },
  { href: "/performances", label: "记一笔业绩", icon: WalletCards },
  { href: "/packages", label: "新增课包", icon: Dumbbell },
  { href: "/salary-rules", label: "设置工资规则", icon: Settings2 }
];

export function HomePageClient() {
  const month = currentMonth();
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<HomeMonthOverview>(() => emptyOverview(month));
  const [studios, setStudios] = useState<Studio[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [packages, setPackages] = useState<MemberPackage[]>([]);
  const [packageItems, setPackageItems] = useState<PackageItem[]>([]);
  const [salaryRules, setSalaryRules] = useState<SalaryRule[]>([]);
  const [salaryCalculations, setSalaryCalculations] = useState<SalaryCalculation[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [message, setMessage] = useState("登录后可以查看你的真实本月概览～");
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
      if (!currentUser) {
        setOverview(emptyOverview(month));
        setMessage("登录后可以查看你的真实本月概览～");
        setLoading(false);
        return;
      }
      const [realTeachers, realStudios, realClasses, realPerformances, realPackages, realPackageItems, realSalaryRules, realSalaryCalculations] = await Promise.all([
        listTeachers(supabase, currentUser.id),
        listStudios(supabase, currentUser.id),
        listClasses(supabase, currentUser.id),
        listPerformances(supabase, currentUser.id),
        listPackages(supabase, currentUser.id),
        listPackageItems(supabase, currentUser.id),
        listSalaryRules(supabase, currentUser.id),
        listSalaryCalculations(supabase, currentUser.id)
      ]);
      const selectedRule = selectSalaryRule(realSalaryRules);
      const nextOverview = buildHomeMonthOverview({
        loggedIn: true,
        month,
        teachers: realTeachers,
        classes: realClasses,
        performances: realPerformances,
        packages: realPackages,
        packageItems: realPackageItems,
        activeSalaryRule: selectedRule.rule,
        salaryCalculations: realSalaryCalculations
      });
      setTeachers(realTeachers);
      setStudios(realStudios);
      setClasses(realClasses);
      setPerformances(realPerformances);
      setPackages(realPackages);
      setPackageItems(realPackageItems);
      setSalaryRules(realSalaryRules);
      setSalaryCalculations(realSalaryCalculations);
      setOverview(nextOverview);
      setMessage(nextOverview.message);
      setLoading(false);
    }).catch(() => {
      setMessage("网络好像开小差了，请再试一次～");
      setLoading(false);
    });
  }, [month]);

  const studioSummaries = useMemo(() => studios.map((studio) => {
    const studioClasses = classes.filter((item) => item.studio_id === studio.id && item.date.startsWith(`${month}-`));
    const studioPerformances = performances.filter((item) => item.studio_id === studio.id && item.date.startsWith(`${month}-`) && item.commissionable);
    const snapshots = salaryCalculations.filter((item) => item.studio_id === studio.id && item.month === month);
    return {
      studio,
      classCount: studioClasses.length,
      performanceTotal: studioPerformances.reduce((sum, item) => sum + item.amount, 0),
      snapshot: snapshots[0]
    };
  }), [classes, month, performances, salaryCalculations, studios]);

  const reminders = useMemo(() => {
    const next: Array<{ label: string; href: string }> = [];
    const unassignedCount = classes.filter((item) => !item.studio_id).length + performances.filter((item) => !item.studio_id).length + packages.filter((item) => !item.studio_id).length;
    if (unassignedCount > 0) next.push({ label: `有 ${unassignedCount} 条记录还没有选择瑜伽馆，去整理～`, href: "/organize" });
    if (!salaryRules.some((item) => item.active)) next.push({ label: "还没有工资规则，设置后可以预估工资～", href: "/salary-rules" });
    const finishedPackage = packages.find((item) => calculatePackageUsageFromClasses(item, classes, packageItems).remainingSessions <= 0);
    if (finishedPackage) next.push({ label: "有课包已上完或超课，记得看一下～", href: "/packages" });
    const missingPackage = classes.find((item) => item.course_type === "private" && !item.package_id);
    if (missingPackage) next.push({ label: "有私教课缺少课包，补充后工资更准确～", href: "/classes" });
    return next.slice(0, 3);
  }, [classes, packageItems, packages, performances, salaryRules]);

  if (loading) {
    return <div className="rounded-3xl bg-card/80 p-5 text-sm text-muted-foreground">正在加载你的记录～</div>;
  }

  if (!user) {
    return (
      <div className="space-y-5">
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">给瑜伽老师自己的工资记录 App</p>
          <h1 className="text-3xl font-semibold tracking-normal">瑜伽工资助手</h1>
          <p className="text-sm leading-6 text-muted-foreground">登录后可以记录课程、课包、业绩和工资规则，按不同瑜伽馆看清每个月的收入。</p>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/login" className="rounded-2xl bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground">登录</Link>
          <Link href="/signup" className="rounded-2xl bg-secondary px-4 py-3 text-center text-sm font-medium text-secondary-foreground">注册</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">{month.replace("-", " 年 ")} 月</p>
        <h1 className="text-2xl font-semibold tracking-normal">这个月也辛苦啦～</h1>
      </section>

      <Card className="bg-gradient-to-br from-secondary via-card to-accent">
        <CardContent className="space-y-4 p-5">
          {message ? <p className="rounded-3xl bg-card/70 p-3 text-sm text-muted-foreground">{message}</p> : null}
          <Link href={`/salary-calculator?month=${month}`} className="block">
            <div className="text-sm text-muted-foreground">本月预计工资</div>
            <div className="mt-2 text-4xl font-semibold text-primary">{overview.estimatedSalary === null ? "待设置" : `¥${formatMoney(overview.estimatedSalary)}`}</div>
            <div className="mt-2 text-sm text-primary">去计算工资</div>
          </Link>
          <div className="grid grid-cols-3 gap-2">
            <Metric href={`/classes?month=${month}`} label="课程" value={`${overview.classCount} 节`} action="查看课程" />
            <Metric href={`/performances?month=${month}&commissionable=true`} label="计提业绩" value={`¥${formatMoney(overview.performanceTotal)}`} action="查看业绩" />
            <Metric href="/salary-history" label="工资快照" value={overview.snapshotCount > 0 ? `${overview.snapshotCount} 个` : "未保存"} action="看历史" />
          </div>
        </CardContent>
      </Card>

      {studioSummaries.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">按瑜伽馆概览</h2>
          {studioSummaries.map((item) => (
            <Link key={item.studio.id} href={`/studios/${item.studio.id}`} className="block rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{item.studio.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">课程 {item.classCount} 节 · 计提业绩 ¥{formatMoney(item.performanceTotal)}</p>
                </div>
                <Building2 className="size-5 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm text-primary">{item.snapshot ? `工资状态：${item.snapshot.status === "settled" ? "已结算" : "未结算"}` : "查看详情"}</p>
            </Link>
          ))}
        </section>
      ) : null}

      {reminders.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">待处理提醒</h2>
          {reminders.map((item) => (
            <Link key={item.label} href={item.href} className="block rounded-3xl bg-amber-50 p-4 text-sm text-amber-800">
              {item.label}
            </Link>
          ))}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">常用操作</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((item) => (
            <Link key={item.href} href={item.href} className="flex min-h-20 flex-col justify-between rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
              <item.icon className="size-5 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ href, label, value, action }: { href: string; label: string; value: string; action: string }) {
  return (
    <Link href={href} className="rounded-2xl bg-card/75 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
      <div className="mt-2 text-xs text-primary">{action}</div>
    </Link>
  );
}
