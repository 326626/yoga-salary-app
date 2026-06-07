"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { WalletCards } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createPerformance, deletePerformance, listMembers, listPackages, listPerformances, listStudios, listTeachers, updatePerformance } from "@/lib/data";
import { mockMembers, mockPackages, mockPerformances, mockStudios, mockTeachers } from "@/lib/mock-data";
import { filterPerformancesByStudio, type StudioRecordFilter } from "@/lib/records/recordFilters";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createPerformanceInputSchema } from "@/lib/validation";
import type { Member, MemberPackage, Performance, PerformanceType, Studio, Teacher } from "@/types";

const performanceTypeLabels: Record<PerformanceType, string> = { new_card: "新办卡", renewal: "续费", private_package: "私教包", product: "商品", other: "其他" };
type FieldErrors = Partial<Record<keyof z.infer<typeof createPerformanceInputSchema>, string>>;
const todayString = () => new Date().toISOString().slice(0, 10);
const initialForm = { date: todayString(), teacher_id: mockTeachers[0]?.id ?? "", studio_id: mockStudios[0]?.id ?? "", type: "new_card", amount: "", customer_name: "", member_id: "", package_id: "", commissionable: true, note: "" };

export function QuickPerformanceForm({ initialStudioId }: { initialStudioId?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [studios, setStudios] = useState<Studio[]>(mockStudios);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [packages, setPackages] = useState<MemberPackage[]>(mockPackages);
  const [records, setRecords] = useState<Performance[]>(mockPerformances);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState("");
  const [tone, setTone] = useState<"success" | "warning" | "error">("success");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StudioRecordFilter>("all");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) return;
      const [realTeachers, realStudios, realMembers, realPackages, realPerformances] = await Promise.all([
        listTeachers(supabase, currentUser.id),
        listStudios(supabase, currentUser.id),
        listMembers(supabase, currentUser.id),
        listPackages(supabase, currentUser.id),
        listPerformances(supabase, currentUser.id)
      ]);
      setTeachers(realTeachers);
      setStudios(realStudios);
      setMembers(realMembers);
      setPackages(realPackages);
      setRecords(realPerformances);
      const preferredStudioId = realStudios.some((studio) => studio.id === initialStudioId) ? initialStudioId : realStudios[0]?.id;
      setForm((current) => ({ ...current, teacher_id: realTeachers[0]?.id ?? "", studio_id: preferredStudioId ?? "" }));
      setFilter(realStudios.some((studio) => studio.id === initialStudioId) ? initialStudioId ?? "all" : "all");
    }).catch(() => {
      setTone("error");
      setFeedback("网络好像开小差了，请再试一次～");
    });
  }, [initialStudioId]);

  useEffect(() => {
    if (user) return;
    if (studios.some((studio) => studio.id === initialStudioId)) {
      setForm((current) => ({ ...current, studio_id: initialStudioId ?? current.studio_id }));
    }
  }, [initialStudioId, studios, user]);

  function updateField<K extends keyof typeof form>(name: K, value: (typeof form)[K]) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "member_id" && typeof value === "string") {
        next.studio_id = members.find((item) => item.id === value)?.studio_id ?? next.studio_id;
      }
      if (name === "package_id" && typeof value === "string") {
        const selected = packages.find((item) => item.id === value);
        next.member_id = selected?.member_id ?? next.member_id;
        next.studio_id = selected?.studio_id ?? next.studio_id;
      }
      return next;
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
  }
  const visibleRecords = filterPerformancesByStudio(records, filter);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createPerformanceInputSchema.safeParse(form);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) nextErrors[issue.path[0] as keyof FieldErrors] = friendlyError(issue.path[0] as keyof FieldErrors, issue.message);
      setErrors(nextErrors);
      return;
    }
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以保存业绩记录～");
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      if (editingId) {
        const updated = await updatePerformance(supabase, user.id, editingId, result.data);
        setRecords((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const newRecord = await createPerformance(supabase, user.id, result.data);
        setRecords((current) => [newRecord, ...current]);
      }
      setForm({ ...initialForm, date: todayString(), teacher_id: result.data.teacher_id, studio_id: result.data.studio_id ?? "" });
      setEditingId(null);
      setTone("success");
      setFeedback(editingId ? "这笔业绩已更新～" : "业绩已记好～");
    } catch {
      setTone("error");
      setFeedback("保存失败，请稍后再试～");
    }
  }

  function startEdit(record: Performance) {
    setEditingId(record.id);
    setForm({
      date: record.date,
      teacher_id: record.teacher_id,
      studio_id: record.studio_id ?? "",
      type: record.type,
      amount: String(record.amount),
      customer_name: record.customer_name ?? "",
      member_id: record.member_id ?? "",
      package_id: record.package_id ?? "",
      commissionable: record.commissionable,
      note: record.note ?? ""
    });
    setFeedback("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...initialForm, date: todayString(), teacher_id: form.teacher_id, studio_id: form.studio_id });
  }

  async function removeRecord(record: Performance) {
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以删除业绩记录～");
      return;
    }
    if (!window.confirm("删除这笔业绩后，本月提成会同步变化。确定删除吗？")) return;
    try {
      const supabase = createBrowserSupabaseClient();
      await deletePerformance(supabase, user.id, record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      if (editingId === record.id) cancelEdit();
      setTone("success");
      setFeedback("这笔业绩已删除～");
    } catch {
      setTone("error");
      setFeedback("删除失败，请稍后再试～");
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2"><p className="text-sm text-muted-foreground">轻松记一笔收入</p><h1 className="text-2xl font-semibold tracking-normal">记一笔业绩</h1></div>
      <Card>
        <CardHeader className="p-4"><CardTitle className="flex items-center gap-2 text-lg"><WalletCards className="size-5 text-primary" />今天成交了什么？</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Feedback message={feedback} tone={tone} />
            {!user ? <div className="rounded-3xl bg-secondary/70 p-4 text-sm text-muted-foreground">登录后可以保存业绩记录～ <Link href="/login" className="font-medium text-primary">去登录</Link></div> : null}
            <Field label="金额" error={errors.amount}><div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-primary">¥</span><Input className="min-h-16 pl-10 text-2xl font-semibold" inputMode="decimal" type="number" min="0" placeholder="0.00" value={form.amount} onChange={(e) => updateField("amount", e.target.value)} /></div></Field>
            <Field label="日期" error={errors.date}><Input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} /></Field>
            <Field label="这笔业绩属于哪个瑜伽馆？" error={errors.studio_id}><Select value={form.studio_id} onChange={(e) => updateField("studio_id", e.target.value)}><option value="">不选择</option>{studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}</Select></Field>
            <Field label="业绩类型" error={errors.type}><Select value={form.type} onChange={(e) => updateField("type", e.target.value)}>{Object.entries(performanceTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
            <Field label="计入提成"><div className="grid grid-cols-2 rounded-2xl bg-muted p-1"><button type="button" className={cn("min-h-11 rounded-xl text-sm font-medium", form.commissionable && "bg-card text-primary shadow-sm")} onClick={() => updateField("commissionable", true)}>计入提成</button><button type="button" className={cn("min-h-11 rounded-xl text-sm font-medium", !form.commissionable && "bg-card text-primary shadow-sm")} onClick={() => updateField("commissionable", false)}>不计提成</button></div></Field>
            <Field label="客户姓名（可选）" error={errors.customer_name}><Input value={form.customer_name} onChange={(e) => updateField("customer_name", e.target.value)} /></Field>
            <details className="rounded-3xl bg-muted/70 p-3"><summary className="cursor-pointer text-sm font-medium">关联会员 / 课包（可选）</summary><div className="mt-3 space-y-3"><Field label="会员" error={errors.member_id}><Select value={form.member_id} onChange={(e) => updateField("member_id", e.target.value)}><option value="">不选择</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field><Field label="课包" error={errors.package_id}><Select value={form.package_id} onChange={(e) => updateField("package_id", e.target.value)}><option value="">不选择</option>{packages.map((p) => <option key={p.id} value={p.id}>{p.package_name}</option>)}</Select></Field></div></details>
            <Field label="备注（可选）" error={errors.note}><Textarea value={form.note} onChange={(e) => updateField("note", e.target.value)} /></Field>
            {editingId ? <Button type="button" variant="secondary" className="w-full" onClick={cancelEdit}>取消编辑</Button> : null}
            <Button type="submit" className="w-full">{editingId ? "保存这笔业绩" : "记下这笔业绩"}</Button>
          </form>
        </CardContent>
      </Card>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold">最近业绩记录</h2><Select className="w-36 text-sm" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">全部瑜伽馆</option><option value="unassigned">未归属</option>{studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}</Select></div>
        {visibleRecords.length === 0 ? <EmptyState text="还没有业绩记录，记录第一笔收入吧～" /> : visibleRecords.slice(0, 12).map((record) => <PerformanceCard key={record.id} record={record} studios={studios} members={members} packages={packages} onEdit={startEdit} onDelete={removeRecord} />)}
      </section>
    </div>
  );
}

function PerformanceCard({ record, studios, members, packages, onEdit, onDelete }: { record: Performance; studios: Studio[]; members: Member[]; packages: MemberPackage[]; onEdit: (record: Performance) => void; onDelete: (record: Performance) => void }) {
  const customer = record.customer_name || members.find((m) => m.id === record.member_id)?.name || "未填写客户";
  const memberPackage = packages.find((item) => item.id === record.package_id);
  return <article className="space-y-3 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="text-sm text-muted-foreground">{record.date}</div><h3 className="mt-1 text-2xl font-semibold text-primary">¥{record.amount.toFixed(2)}</h3></div><Badge className={record.commissionable ? undefined : "bg-amber-50 text-amber-800"}>{record.commissionable ? "计入提成" : "不计提成"}</Badge></div><div className="grid gap-1 text-sm text-muted-foreground"><span>{performanceTypeLabels[record.type]} · {record.studio_id ? `归属：${studios.find((s) => s.id === record.studio_id)?.name ?? "瑜伽馆"}` : "未选择瑜伽馆"}</span><span>客户：{customer}</span>{record.member_id ? <span>会员：{members.find((m) => m.id === record.member_id)?.name ?? ""}</span> : null}{memberPackage ? <span>课包：{memberPackage.package_name}</span> : null}</div><div className="grid grid-cols-2 gap-2"><Button type="button" variant="secondary" size="sm" onClick={() => onEdit(record)}>编辑</Button><Button type="button" variant="outline" size="sm" onClick={() => onDelete(record)}>删除</Button></div></article>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{error ? <p className="text-sm text-destructive">{error}</p> : null}</div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function friendlyError(field: keyof FieldErrors, fallback: string) {
  const messages: FieldErrors = { teacher_id: "请先创建我的档案", studio_id: "请选择瑜伽馆", date: "请选择日期", type: "请选择业绩类型", amount: "金额不能小于 0" };
  return messages[field] ?? fallback;
}
