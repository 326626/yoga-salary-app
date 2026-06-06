"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { CalendarDays, ChevronDown, ReceiptText, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteSalaryCalculation, listSalaryCalculations, listStudios, markSalaryCalculationSettled, markSalaryCalculationUnsettled } from "@/lib/data";
import { formatMoney, getSettlementLabel, getSettlementTone } from "@/lib/salary";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { settlementInputSchema } from "@/lib/validation";
import type { SalaryCalculation, Studio } from "@/types";

type Draft = {
  actual_paid_amount: string;
  settled_at: string;
  note: string;
};

const today = new Date().toISOString().slice(0, 10);

export function SalaryHistoryView() {
  const [user, setUser] = useState<User | null>(null);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [records, setRecords] = useState<SalaryCalculation[]>([]);
  const [monthFilter, setMonthFilter] = useState("");
  const [studioFilter, setStudioFilter] = useState("all");
  const [expandedId, setExpandedId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      setMessage("还没有连接 Supabase，工资历史需要登录后保存。");
      return;
    }
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }
      const [realStudios, realRecords] = await Promise.all([
        listStudios(supabase, currentUser.id),
        listSalaryCalculations(supabase, currentUser.id)
      ]);
      setStudios(realStudios);
      setRecords(realRecords);
      setLoading(false);
    }).catch(() => {
      setMessage("网络好像开小差了，请再试一次～");
      setLoading(false);
    });
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const monthMatched = monthFilter ? item.month === monthFilter : true;
      const studioMatched = studioFilter === "all" ? true : studioFilter === "global" ? !item.studio_id : item.studio_id === studioFilter;
      return monthMatched && studioMatched;
    });
  }, [monthFilter, records, studioFilter]);

  function getStudioName(studioId: string | null) {
    if (!studioId) return "全部瑜伽馆";
    return studios.find((studio) => studio.id === studioId)?.name ?? "已删除的瑜伽馆";
  }

  function openRecord(record: SalaryCalculation) {
    setExpandedId((current) => current === record.id ? "" : record.id);
    setDrafts((current) => ({
      ...current,
      [record.id]: current[record.id] ?? {
        actual_paid_amount: record.actual_paid_amount === null ? "" : String(record.actual_paid_amount),
        settled_at: record.settled_at ?? today,
        note: record.note ?? ""
      }
    }));
  }

  function updateDraft(recordId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [recordId]: { ...(current[recordId] ?? { actual_paid_amount: "", settled_at: today, note: "" }), ...patch }
    }));
  }

  async function handleSettled(record: SalaryCalculation) {
    if (!user) return;
    const draft = drafts[record.id] ?? { actual_paid_amount: "", settled_at: today, note: "" };
    const parsed = settlementInputSchema.safeParse({
      status: "settled",
      actual_paid_amount: draft.actual_paid_amount,
      settled_at: draft.settled_at || today,
      note: draft.note
    });
    if (!parsed.success) {
      setMessage("实际到账金额或结算日期不太对，请再检查一下～");
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      const updated = await markSalaryCalculationSettled(supabase, user.id, record.id, {
        actual_paid_amount: parsed.data.actual_paid_amount,
        settled_at: parsed.data.settled_at,
        note: parsed.data.note
      });
      setRecords((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(record.status === "settled" ? "已更新结算信息～" : "已标记为结算～");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后再试～");
    }
  }

  async function handleUnsettled(record: SalaryCalculation) {
    if (!user) return;
    const draft = drafts[record.id] ?? { actual_paid_amount: "", settled_at: today, note: "" };
    const parsed = settlementInputSchema.safeParse({
      status: "unsettled",
      actual_paid_amount: draft.actual_paid_amount,
      settled_at: null,
      note: draft.note
    });
    if (!parsed.success) {
      setMessage("实际到账金额不太对，请再检查一下～");
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      const updated = await markSalaryCalculationUnsettled(supabase, user.id, record.id, {
        actual_paid_amount: parsed.data.actual_paid_amount,
        note: parsed.data.note
      });
      setRecords((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage("已改为未结算～");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后再试～");
    }
  }

  async function handleDelete(record: SalaryCalculation) {
    if (!user) return;
    const confirmed = window.confirm("删除后不会影响原始课程和业绩记录，只会删除这份工资快照。确定删除吗？");
    if (!confirmed) return;
    try {
      const supabase = createBrowserSupabaseClient();
      await deleteSalaryCalculation(supabase, user.id, record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setMessage("工资快照已删除～");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败，请稍后再试～");
    }
  }

  if (loading) {
    return <div className="rounded-3xl bg-card/80 p-5 text-sm text-muted-foreground">正在整理工资历史...</div>;
  }

  if (!user) {
    return (
      <div className="space-y-5">
        <Header />
        <Card><CardContent className="space-y-4 p-5 text-sm text-muted-foreground"><p>登录后可以查看和管理已保存的工资快照～</p><Button asChild><Link href="/login">去登录</Link></Button></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Header />
      <Feedback message={message} tone={message.includes("失败") || message.includes("不太对") ? "error" : "success"} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="月份">
              <Input type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} />
            </Field>
            <Field label="瑜伽馆">
              <Select value={studioFilter} onChange={(event) => setStudioFilter(event.target.value)}>
                <option value="all">全部</option>
                <option value="global">全部瑜伽馆快照</option>
                {studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}
              </Select>
            </Field>
          </div>
          <p className="rounded-3xl bg-muted/70 p-3 text-xs leading-5 text-muted-foreground">
            工资快照保存的是当时的计算结果。之后修改课程、业绩或规则，不会自动改动这里的历史记录～
          </p>
        </CardContent>
      </Card>

      {filteredRecords.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">还没有保存过工资，先去工资页计算并保存一个月吧～</div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const draft = drafts[record.id] ?? { actual_paid_amount: record.actual_paid_amount === null ? "" : String(record.actual_paid_amount), settled_at: record.settled_at ?? today, note: record.note ?? "" };
            const settlementTone = getSettlementTone(record.salary_total, record.actual_paid_amount);
            return (
              <article key={record.id} className="space-y-4 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
                <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => openRecord(record)}>
                  <span>
                    <span className="text-sm text-muted-foreground">{record.month} · {getStudioName(record.studio_id)}</span>
                    <span className="mt-1 block text-2xl font-semibold text-primary">¥{formatMoney(record.salary_total)}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">保存于 {new Date(record.created_at).toLocaleDateString("zh-CN")}</span>
                  </span>
                  <span className="flex flex-col items-end gap-2">
                    <Badge className={record.status === "settled" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{record.status === "settled" ? "已结算" : "未结算"}</Badge>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </span>
                </button>

                {record.actual_paid_amount !== null ? (
                  <div className={settlementTone === "negative" ? "rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800" : "rounded-2xl bg-secondary/70 px-3 py-2 text-sm text-muted-foreground"}>
                    实际到账 ¥{formatMoney(record.actual_paid_amount)} · {getSettlementLabel(record.salary_total, record.actual_paid_amount)}
                  </div>
                ) : null}

                {expandedId === record.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Stat label="课时费" value={`¥${formatMoney(record.class_fee_total)}`} />
                      <Stat label="计提业绩" value={`¥${formatMoney(record.performance_total)}`} />
                      <Stat label="业绩提成" value={`¥${formatMoney(record.commission_total)}`} />
                      <Stat label="奖金 / 扣款" value={`¥${formatMoney(record.bonus_total)} / ¥${formatMoney(record.deduction_total)}`} />
                    </div>

                    <Breakdown record={record} />

                    <div className="space-y-3 rounded-3xl bg-secondary/60 p-4">
                      <h3 className="font-medium">结算信息</h3>
                      <Field label="实际到账金额">
                        <Input type="number" min="0" step="0.01" value={draft.actual_paid_amount} onChange={(event) => updateDraft(record.id, { actual_paid_amount: event.target.value })} placeholder="例如 6600" />
                      </Field>
                      <Field label="结算日期">
                        <Input type="date" value={draft.settled_at} onChange={(event) => updateDraft(record.id, { settled_at: event.target.value })} />
                      </Field>
                      <Field label="备注">
                        <Textarea value={draft.note} onChange={(event) => updateDraft(record.id, { note: event.target.value })} placeholder="例如：已微信到账" />
                      </Field>
                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => handleSettled(record)}>标记为已结算</Button>
                        <Button variant="secondary" onClick={() => handleUnsettled(record)}>改为未结算</Button>
                      </div>
                      <Button variant="outline" className="w-full text-destructive" onClick={() => handleDelete(record)}>
                        <Trash2 className="mr-2 size-4" aria-hidden="true" />
                        删除工资快照
                      </Button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">保存每个月的工资结果</p>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-normal">工资历史</h1>
        <Button asChild size="sm" variant="secondary"><Link href="/salary-calculator"><CalendarDays className="mr-1 size-4" />去计算</Link></Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl bg-card/80 p-3"><div className="text-sm font-semibold text-primary">{value}</div><div className="mt-1 text-xs text-muted-foreground">{label}</div></div>;
}

function Breakdown({ record }: { record: SalaryCalculation }) {
  const classFees = record.breakdown.classFees.filter(isRecord);
  const commissions = record.breakdown.commissions.filter(isRecord);
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 font-medium"><ReceiptText className="size-4 text-primary" />快照明细</h3>
      {classFees.slice(0, 6).map((item, index) => (
        <div key={`${record.id}-class-${index}`} className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">{String(item.courseName ?? "课程")}</div>
          <div>{String(item.formula ?? "已保存课时费计算过程")}</div>
          {"amount" in item ? <div className="font-medium text-primary">课时费：¥{formatMoney(Number(item.amount))}</div> : null}
        </div>
      ))}
      {commissions.slice(0, 4).map((item, index) => (
        <div key={`${record.id}-commission-${index}`} className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">{String(item.rangeLabel ?? "业绩提成")}</div>
          <div>{String(item.formula ?? "已保存提成计算过程")}</div>
          {"amount" in item ? <div className="font-medium text-primary">提成：¥{formatMoney(Number(item.amount))}</div> : null}
        </div>
      ))}
      {record.breakdown.warnings.length > 0 ? (
        <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{record.breakdown.warnings.join("；")}</div>
      ) : null}
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
