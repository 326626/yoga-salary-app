"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AlertCircle, Calculator, Coins, Gift, History, MinusCircle, NotebookText, Save, TrendingUp, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { calculatePackageUsageFromClasses, createSalaryCalculation, findSalaryCalculationByMonthAndStudio, listClasses, listMembers, listPackages, listPerformances, listSalaryRules, listStudios, listTeachers, updateSalaryCalculation } from "@/lib/data";
import { activeMockSalaryRule, mockClasses, mockMembers, mockPackages, mockPerformances, mockStudios, mockTeachers } from "@/lib/mock-data";
import { getPackageUsageLabel } from "@/lib/packages/usageDisplay";
import { calculateMonthlySalary, type MonthlySalaryResult } from "@/lib/salary";
import { describeClassFeeContext, getPrivateClassPackageWarning } from "@/lib/salary/detailDisplay";
import { filterSalaryData } from "@/lib/salary/filterSalaryData";
import { formatMoney } from "@/lib/salary/formatMoney";
import { selectSalaryRule } from "@/lib/salary/selectSalaryRule";
import { buildUnassignedNotice } from "@/lib/studios/studioOverview";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ClassRecord, Member, MemberPackage, Performance, SalaryCalculation, SalaryRule, Studio, StructuredSalaryRule, Teacher } from "@/types";

const courseTypeLabels: Record<string, string> = {
  group: "团课",
  private: "私教",
  trial: "体验课",
  substitute: "代课",
  other: "其他"
};

const defaultMonth = "2026-06";

function emptyRule(): StructuredSalaryRule {
  return {
    class_fee_rules: [],
    commission_rules: [],
    commission_mode: "unknown",
    bonus_rules: [],
    deduction_rules: [],
    uncertain_items: []
  };
}

function calculateFor(teacherId: string, month: string, classes = mockClasses, performances = mockPerformances, packages = mockPackages, salaryRule = activeMockSalaryRule) {
  return calculateMonthlySalary({
    teacherId,
    month,
    classes,
    performances,
    packages,
    salaryRule: salaryRule?.structured_rule ?? emptyRule()
  });
}

export function SalaryCalculatorView({ initialStudioId }: { initialStudioId?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [studios, setStudios] = useState<Studio[]>(mockStudios);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [classes, setClasses] = useState<ClassRecord[]>(mockClasses);
  const [performances, setPerformances] = useState<Performance[]>(mockPerformances);
  const [packages, setPackages] = useState<MemberPackage[]>(mockPackages);
  const [salaryRules, setSalaryRules] = useState<SalaryRule[]>(activeMockSalaryRule ? [activeMockSalaryRule] : []);
  const [message, setMessage] = useState("当前是体验数据，登录后可以计算你自己的工资。");
  const [teacherId, setTeacherId] = useState(mockTeachers[0]?.id ?? "");
  const [studioId, setStudioId] = useState("");
  const [month, setMonth] = useState(defaultMonth);
  const [result, setResult] = useState<MonthlySalaryResult>(() => calculateFor(mockTeachers[0]?.id ?? "", defaultMonth));
  const [savedSnapshot, setSavedSnapshot] = useState<SalaryCalculation | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) return;
      const [realTeachers, realStudios, realMembers, realClasses, realPerformances, realPackages, realSalaryRules, existingSnapshot] = await Promise.all([
        listTeachers(supabase, currentUser.id),
        listStudios(supabase, currentUser.id),
        listMembers(supabase, currentUser.id),
        listClasses(supabase, currentUser.id),
        listPerformances(supabase, currentUser.id),
        listPackages(supabase, currentUser.id),
        listSalaryRules(supabase, currentUser.id),
        findSalaryCalculationByMonthAndStudio(supabase, currentUser.id, month, studioId || null)
      ]);
      setTeachers(realTeachers);
      setStudios(realStudios);
      const effectiveStudioId = realStudios.some((studio) => studio.id === initialStudioId) ? initialStudioId ?? studioId : studioId;
      if (effectiveStudioId !== studioId) setStudioId(effectiveStudioId);
      setMembers(realMembers);
      setClasses(realClasses);
      setPerformances(realPerformances);
      setPackages(realPackages);
      setSalaryRules(realSalaryRules);
      setSavedSnapshot(existingSnapshot);
      const nextTeacherId = realTeachers[0]?.id ?? "";
      setTeacherId(nextTeacherId);
      const selectedRule = selectSalaryRule(realSalaryRules, effectiveStudioId);
      if (realTeachers.length === 0) {
        setMessage("还没有老师档案，先创建一个吧～");
      } else if (!selectedRule.rule) {
        setMessage(selectedRule.message ?? "还没有启用工资规则，先去工资规则页面设置一下～");
      } else {
        setMessage(selectedRule.message ?? "");
        const filtered = filterSalaryData({ classes: realClasses, performances: realPerformances, packages: realPackages, studioId: effectiveStudioId });
        setResult(calculateFor(nextTeacherId, month, filtered.classes, filtered.performances, filtered.packages, selectedRule.rule));
      }
    }).catch(() => {
      setMessage("网络好像开小差了，请再试一次～");
    });
  }, [month, studioId, initialStudioId]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    findSalaryCalculationByMonthAndStudio(supabase, user.id, month, studioId || null)
      .then(setSavedSnapshot)
      .catch(() => setSavedSnapshot(null));
  }, [month, studioId, user]);

  useEffect(() => {
    if (user) return;
    if (studios.some((studio) => studio.id === initialStudioId)) {
      setStudioId(initialStudioId ?? "");
    }
  }, [initialStudioId, studios, user]);

  function handleCalculate() {
    const selectedRule = selectSalaryRule(salaryRules, studioId);
    if (user && !selectedRule.rule) {
      setMessage(selectedRule.message ?? "还没有启用工资规则，先去工资规则页面设置一下～");
      return;
    }
    const filtered = filterSalaryData({ classes, performances, packages, studioId });
    setMessage(selectedRule.message ?? "");
    setResult(calculateFor(teacherId, month, filtered.classes, filtered.performances, filtered.packages, selectedRule.rule ?? activeMockSalaryRule));
  }

  async function handleSaveSnapshot() {
    if (!user) {
      setMessage("登录后可以保存工资记录～");
      return;
    }
    const selectedRule = selectSalaryRule(salaryRules, studioId);
    if (!selectedRule.rule) {
      setMessage(selectedRule.message ?? "还没有工资规则，先设置一下吧～");
      return;
    }
    if (!result.teacherId) {
      setMessage("还没有老师档案，先创建一个吧～");
      return;
    }

    setSaving(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const payload = {
        teacher_id: result.teacherId,
        studio_id: studioId || undefined,
        month: result.month,
        class_fee_total: result.classFeeTotal,
        performance_total: result.performanceTotal,
        commission_total: result.commissionTotal,
        bonus_total: result.bonusTotal,
        deduction_total: result.deductionTotal,
        salary_total: result.salaryTotal,
        breakdown: result.breakdown
      };
      const saved = savedSnapshot
        ? await updateSalaryCalculation(supabase, user.id, savedSnapshot.id, payload)
        : await createSalaryCalculation(supabase, user.id, { ...payload, status: "unsettled", actual_paid_amount: null, settled_at: null, note: "" });
      setSavedSnapshot(saved);
      setMessage(savedSnapshot ? "本月工资快照已更新～" : "本月工资已保存～");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后再试～");
    } finally {
      setSaving(false);
    }
  }

  const currentTeacherName = useMemo(() => teachers.find((teacher) => teacher.id === result.teacherId)?.name ?? "体验老师", [teachers, result.teacherId]);

  const composition = [
    { label: "课时费", value: result.classFeeTotal, icon: NotebookText },
    { label: "计提业绩", value: result.performanceTotal, icon: TrendingUp },
    { label: "业绩提成", value: result.commissionTotal, icon: Coins },
    { label: "奖金", value: result.bonusTotal, icon: Gift },
    { label: "扣款", value: result.deductionTotal, icon: MinusCircle }
  ];
  const unassignedCounts = useMemo(() => {
    const classesCount = classes.filter((item) => !item.studio_id).length;
    const performancesCount = performances.filter((item) => !item.studio_id).length;
    return { classes: classesCount, performances: performancesCount, total: classesCount + performancesCount };
  }, [classes, performances]);
  const unassignedNotice = !studioId ? buildUnassignedNotice(unassignedCounts) : "";

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">这个月预计可以拿到</p>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-normal">工资</h1>
          <Button asChild size="sm" variant="secondary">
            <Link href="/salary-history">
              <History className="mr-1 size-4" aria-hidden="true" />
              历史工资
            </Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-secondary via-card to-accent">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">预计工资</p>
              <div className="mt-2 text-4xl font-semibold text-primary">¥{formatMoney(result.salaryTotal)}</div>
              <p className="mt-2 text-sm text-muted-foreground">{month} · {currentTeacherName}</p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-2xl bg-card/80 text-primary shadow-sm">
              <Wallet className="size-5" aria-hidden="true" />
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="size-5 text-primary" aria-hidden="true" />
            计算条件
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          {message ? <div className="rounded-3xl bg-secondary/70 p-4 text-sm text-muted-foreground">{message} {message.includes("工资规则") ? <Link href="/salary-rules" className="font-medium text-primary">去设置</Link> : message.includes("老师") ? <Link href="/teachers" className="font-medium text-primary">去创建</Link> : <Link href="/login" className="font-medium text-primary">去登录</Link>}</div> : null}
          {unassignedNotice ? <div className="rounded-3xl bg-amber-50 p-4 text-sm text-amber-800">{unassignedNotice} <Link href="/organize" className="font-medium text-primary">去整理归属</Link></div> : null}
          {studioId && result.breakdown.classFees.length === 0 && result.performanceTotal === 0 ? <div className="rounded-3xl bg-secondary/70 p-4 text-sm text-muted-foreground">这个瑜伽馆本月还没有记录～</div> : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label="老师">
              <Select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="月份">
              <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </Field>
          </div>
          <Field label="按瑜伽馆筛选">
            <Select value={studioId} onChange={(event) => setStudioId(event.target.value)}>
              <option value="">全部瑜伽馆</option>
              {studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}
            </Select>
          </Field>
          <Button className="w-full" onClick={handleCalculate}>
            计算本月工资
          </Button>
          <Button className="w-full" variant="secondary" onClick={handleSaveSnapshot} disabled={saving}>
            <Save className="mr-2 size-4" aria-hidden="true" />
            {saving ? "正在保存..." : savedSnapshot ? "更新本月工资快照" : "保存这个月工资"}
          </Button>
          <p className="rounded-3xl bg-muted/70 p-3 text-xs leading-5 text-muted-foreground">
            工资快照会保留当时的计算结果。如果之后改了课程或业绩，可以重新计算并更新快照～
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">工资组成</h2>
        <div className="grid grid-cols-2 gap-3">
          {composition.map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
              <item.icon className="mb-3 size-5 text-primary" aria-hidden="true" />
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="mt-1 text-lg font-semibold">¥{formatMoney(item.value)}</div>
            </div>
          ))}
        </div>
      </section>

      {result.breakdown.warnings.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">需要补充的信息</h2>
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            有 {result.breakdown.warnings.length} 条课程需要补充信息，补充后工资会更准确～
          </div>
          {result.breakdown.warnings.map((warning) => (
            <div key={warning} className="flex gap-2 rounded-3xl border border-amber-100 bg-card/90 p-4 text-sm text-amber-800 shadow-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{warning.includes("私教课") ? "这节私教课缺少课包，补充课包后工资会更准确～" : warning}</span>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">课时费明细</h2>
        {result.breakdown.classFees.length === 0 ? (
          <EmptyState text="这个月还没有课程记录。" />
        ) : (
          result.breakdown.classFees.map((item) => {
            const classRecord = classes.find((record) => record.id === item.classId);
            const memberPackage = packages.find((record) => record.id === classRecord?.package_id);
            const packageUsage = memberPackage ? calculatePackageUsageFromClasses(memberPackage, classes) : null;
            const context = describeClassFeeContext({ classRecord, members, packages, formula: item.formula });
            const warning = getPrivateClassPackageWarning(Boolean(classRecord?.package_id));

            return (
            <article key={item.classId} className="space-y-3 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">{item.date}</div>
                  <h3 className="mt-1 font-medium">{item.courseName}</h3>
                </div>
                <Badge>{courseTypeLabels[item.courseType] ?? item.courseType}</Badge>
              </div>
              <div className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-muted-foreground">{context}</div>
              {packageUsage ? (
                <div className={packageUsage.isOverused ? "rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800" : "rounded-2xl bg-secondary/70 px-3 py-2 text-sm text-muted-foreground"}>
                  课包当前：已上 {packageUsage.usedSessions} 节，{getPackageUsageLabel(packageUsage)}
                </div>
              ) : null}
              <div className="font-semibold text-primary">课时费：¥{formatMoney(item.amount)}</div>
              {item.warning ? <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{warning || "补充课包后，工资会算得更准确～"}</div> : null}
            </article>
            );
          })
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">业绩提成明细</h2>
        {result.breakdown.commissions.length === 0 ? (
          <EmptyState text="这个月暂时没有可计算的业绩提成。" />
        ) : (
          result.breakdown.commissions.map((item) => (
            <article key={`${item.rangeLabel}-${item.baseAmount}`} className="rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">{item.rangeLabel} 元</div>
                  <h3 className="mt-1 font-medium">参与计算：¥{formatMoney(item.baseAmount)}</h3>
                </div>
                <Badge>{Number((item.rate * 100).toFixed(2))}%</Badge>
              </div>
              <div className="mt-3 rounded-2xl bg-muted/70 px-3 py-2 text-sm text-muted-foreground">{item.formula}</div>
              <div className="mt-3 font-semibold text-primary">提成：¥{formatMoney(item.amount)}</div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}
