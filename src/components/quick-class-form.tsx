"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AlertCircle, BookOpenCheck } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyClassQueryPrefill, derivePackageSelection, filterPackagesForMember, type ClassPrefillQuery } from "@/lib/classPrefill";
import { calculatePackageUsageFromClasses, createClassRecord, createDefaultTeacher, deleteClassRecord, listClasses, listMembers, listPackages, listStudios, listTeachers, updateClassRecord, type PackageUsage } from "@/lib/data";
import { mockClasses, mockMembers, mockPackages, mockStudios, mockTeachers } from "@/lib/mock-data";
import { buildOveruseWarning, getPackageFinishedMessage, getPackageUsageLabel, getPackageUsageTone } from "@/lib/packages/usageDisplay";
import { filterClassesByStudio, type StudioRecordFilter } from "@/lib/records/recordFilters";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createClassRecordInputSchema } from "@/lib/validation";
import type { ClassRecord, CourseType, Member, MemberPackage, Studio, Teacher } from "@/types";

const courseTypeLabels: Record<CourseType, string> = { group: "团课", private: "私教", trial: "体验课", substitute: "代课", other: "其他" };
type FieldErrors = Partial<Record<keyof z.infer<typeof createClassRecordInputSchema>, string>>;
const todayString = () => new Date().toISOString().slice(0, 10);
const initialForm = {
  date: todayString(),
  teacher_id: mockTeachers[0]?.id ?? "",
  studio_id: mockStudios[0]?.id ?? "",
  course_type: "group",
  course_name: "",
  hours: "1",
  student_count: "1",
  member_id: "",
  package_id: "",
  manual_fee: "",
  note: ""
};

export function QuickClassForm({ initialQuery = {} }: { initialQuery?: ClassPrefillQuery }) {
  const [user, setUser] = useState<User | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [studios, setStudios] = useState<Studio[]>(mockStudios);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [packages, setPackages] = useState<MemberPackage[]>(mockPackages);
  const [records, setRecords] = useState<ClassRecord[]>(mockClasses);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState("");
  const [tone, setTone] = useState<"success" | "warning" | "error">("success");
  const [teacherTouched, setTeacherTouched] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StudioRecordFilter>("all");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) return;
      try {
        const [realTeachers, realStudios, realMembers, realPackages, realClasses] = await Promise.all([
          listTeachers(supabase, currentUser.id),
          listStudios(supabase, currentUser.id),
          listMembers(supabase, currentUser.id),
          listPackages(supabase, currentUser.id),
          listClasses(supabase, currentUser.id)
        ]);
        setTeachers(realTeachers);
        setStudios(realStudios);
        setMembers(realMembers);
        setPackages(realPackages);
        setRecords(realClasses);
        const preferredStudioId = realStudios.some((studio) => studio.id === initialQuery.studioId) ? initialQuery.studioId : realStudios[0]?.id;
        setForm((current) => applyClassQueryPrefill({ ...current, teacher_id: realTeachers[0]?.id ?? "", studio_id: preferredStudioId ?? "" }, initialQuery, realPackages));
        setFilter(realStudios.some((studio) => studio.id === initialQuery.studioId) ? initialQuery.studioId ?? "all" : "all");
      } catch {
        setTone("warning");
        setFeedback("数据表还没有同步到最新版本，请先在 Supabase 执行迁移 SQL。");
      }
    }).catch(() => {
      setTone("error");
      setFeedback("网络好像开小差了，请再试一次～");
    });
  }, [initialQuery]);

  useEffect(() => {
    if (user) return;
    setForm((current) => applyClassQueryPrefill({ ...current, studio_id: studios.some((studio) => studio.id === initialQuery.studioId) ? initialQuery.studioId ?? current.studio_id : current.studio_id }, initialQuery, packages));
  }, [initialQuery, packages, studios, user]);

  const isPrivate = form.course_type === "private";
  const packageOptions = useMemo(() => filterPackagesForMember(packages, form.member_id), [form.member_id, packages]);
  const selectedPackage = useMemo(() => packages.find((item) => item.id === form.package_id), [form.package_id, packages]);
  const selectedPackageUsage = useMemo(
    () => (selectedPackage ? calculatePackageUsageFromClasses(selectedPackage, records) : null),
    [records, selectedPackage]
  );
  const overuseWarning = useMemo(() => {
    if (!selectedPackageUsage) return "";
    return buildOveruseWarning(Number(form.hours || 0), selectedPackageUsage.remainingSessions);
  }, [form.hours, selectedPackageUsage]);
  const visibleRecords = useMemo(() => filterClassesByStudio(records, filter), [filter, records]);

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "teacher_id") setTeacherTouched(true);
      if (name === "package_id" && value) {
        const selected = packages.find((item) => item.id === value);
        const derived = derivePackageSelection({
          packageId: value,
          packages,
          currentTeacherId: current.teacher_id,
          teacherTouched
        });
        next.member_id = derived.member_id ?? next.member_id;
        next.teacher_id = derived.teacher_id ?? next.teacher_id;
        next.studio_id = derived.studio_id ?? selected?.studio_id ?? next.studio_id;
      }
      if (name === "member_id" && value) {
        next.studio_id = members.find((item) => item.id === value)?.studio_id ?? next.studio_id;
      }
      if (name === "member_id" || (name === "course_type" && value !== "private")) next.package_id = "";
      if (name === "course_type" && value !== "private") next.member_id = "";
      if (name === "course_type" && value === "private" && !next.course_name) next.course_name = "私教课";
      return next;
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function createDefault() {
    if (!user) return;
    try {
      const supabase = createBrowserSupabaseClient();
      const teacher = await createDefaultTeacher(supabase, user.id);
      setTeachers([teacher]);
      setForm((current) => ({ ...current, teacher_id: teacher.id }));
      setTone("success");
      setFeedback("已创建你的老师档案～");
    } catch {
      setTone("error");
      setFeedback("保存失败，请稍后再试～");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createClassRecordInputSchema.safeParse(form);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) nextErrors[issue.path[0] as keyof FieldErrors] = friendlyError(issue.path[0] as keyof FieldErrors, issue.message);
      setErrors(nextErrors);
      return;
    }
    if (result.data.course_type === "private" && !result.data.package_id && !window.confirm("没有选择课包，工资计算时可能无法按成交单价计算课时费。仍然保存吗？")) {
      return;
    }
    if (result.data.course_type === "private" && result.data.package_id && selectedPackageUsage) {
      const warning = buildOveruseWarning(result.data.hours, selectedPackageUsage.remainingSessions);
      if (warning && !window.confirm(`${warning}\n\n保存后会超出课包课时，确认继续记录吗？`)) {
        return;
      }
    }
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以保存课程记录～");
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      if (editingId) {
        const updated = await updateClassRecord(supabase, user.id, editingId, result.data);
        setRecords((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const newRecord = await createClassRecord(supabase, user.id, result.data);
        setRecords((current) => [newRecord, ...current]);
      }
      setForm({ ...initialForm, date: todayString(), teacher_id: result.data.teacher_id, studio_id: result.data.studio_id ?? "" });
      setEditingId(null);
      setTone("success");
      setFeedback(editingId ? "这节课已更新～" : result.data.course_type === "private" ? "这节私教课已记录～" : "已记录这节课～");
    } catch {
      setTone("error");
      setFeedback("保存失败，请稍后再试～");
    }
  }

  function startEdit(record: ClassRecord) {
    setEditingId(record.id);
    setForm({
      date: record.date,
      teacher_id: record.teacher_id,
      studio_id: record.studio_id ?? "",
      course_type: record.course_type,
      course_name: record.course_name,
      hours: String(record.hours),
      student_count: String(record.student_count),
      member_id: record.member_id ?? "",
      package_id: record.package_id ?? "",
      manual_fee: record.manual_fee === null ? "" : String(record.manual_fee),
      note: record.note ?? ""
    });
    setFeedback("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...initialForm, date: todayString(), teacher_id: form.teacher_id, studio_id: form.studio_id });
  }

  async function removeRecord(record: ClassRecord) {
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以删除课程记录～");
      return;
    }
    if (!window.confirm("删除这节课后，课包剩余课时和工资计算都会同步变化。确定删除吗？")) return;
    try {
      const supabase = createBrowserSupabaseClient();
      await deleteClassRecord(supabase, user.id, record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      if (editingId === record.id) cancelEdit();
      setTone("success");
      setFeedback("这节课已删除～");
    } catch {
      setTone("error");
      setFeedback("删除失败，请稍后再试～");
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2"><p className="text-sm text-muted-foreground">30 秒快速记课</p><h1 className="text-2xl font-semibold tracking-normal">记一节课</h1></div>
      <Card>
        <CardHeader className="p-4"><CardTitle className="flex items-center gap-2 text-lg"><BookOpenCheck className="size-5 text-primary" />今天上了什么课？</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Feedback message={feedback} tone={tone} />
            {!user ? <div className="rounded-3xl bg-secondary/70 p-4 text-sm text-muted-foreground">登录后可以保存课程记录～ <Link href="/login" className="font-medium text-primary">去登录</Link></div> : null}
            {user && teachers.length === 0 ? <div className="space-y-3 rounded-3xl bg-secondary/70 p-4 text-sm text-muted-foreground"><p>需要先创建一个兼容档案，之后会在后台自动使用。</p><Button type="button" className="w-full" onClick={createDefault}>创建我的档案</Button></div> : null}
            {user && studios.length === 0 ? <div className="rounded-3xl bg-secondary/70 p-4 text-sm text-muted-foreground">可以先添加一个瑜伽馆，之后工资就能按地点区分～ <Link href="/studios" className="font-medium text-primary">去添加</Link></div> : null}
            <Field label="日期" error={errors.date}><Input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} /></Field>
            <Field label="在哪个瑜伽馆上课？" error={errors.studio_id}><Select value={form.studio_id} onChange={(e) => updateField("studio_id", e.target.value)}><option value="">不选择</option>{studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}</Select></Field>
            <Field label="课程类型" error={errors.course_type}><Select value={form.course_type} onChange={(e) => updateField("course_type", e.target.value)}>{Object.entries(courseTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
            <Field label="课程名称" error={errors.course_name}><Input placeholder="例如：晨间流瑜伽" value={form.course_name} onChange={(e) => updateField("course_name", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="课时数" error={errors.hours}><Input type="number" inputMode="decimal" min="0" step="0.5" value={form.hours} onChange={(e) => updateField("hours", e.target.value)} /></Field>
              <Field label="学员人数" error={errors.student_count}><Input type="number" inputMode="numeric" min="0" value={form.student_count} onChange={(e) => updateField("student_count", e.target.value)} /></Field>
            </div>
            <div className={isPrivate ? "space-y-3 rounded-3xl bg-secondary/70 p-3" : "space-y-3 rounded-3xl bg-muted/70 p-3"}>
              {isPrivate ? <p className="text-sm text-muted-foreground">私教课建议选择会员和课包，这样可以按成交单价自动计算课时费。</p> : null}
              <Field label="会员" error={errors.member_id}><Select value={form.member_id} onChange={(e) => updateField("member_id", e.target.value)}><option value="">不选择</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>
              <Field label="课包" error={errors.package_id}><Select value={form.package_id} onChange={(e) => updateField("package_id", e.target.value)}><option value="">不选择</option>{packageOptions.map((p) => <option key={p.id} value={p.id}>{p.package_name} · {p.unit_price.toFixed(0)} 元/节</option>)}</Select></Field>
              {selectedPackageUsage ? <PackageUsageHint usage={selectedPackageUsage} overuseWarning={overuseWarning} /> : null}
            </div>
            <Field label="手动课时费（可选）" error={errors.manual_fee}><Input type="number" min="0" value={form.manual_fee} onChange={(e) => updateField("manual_fee", e.target.value)} /></Field>
            <Field label="备注（可选）" error={errors.note}><Textarea value={form.note} onChange={(e) => updateField("note", e.target.value)} /></Field>
            {editingId ? <Button type="button" variant="secondary" className="w-full" onClick={cancelEdit}>取消编辑</Button> : null}
            <Button type="submit" className="w-full" disabled={user !== null && teachers.length === 0}>{editingId ? "保存这节课" : "记下这节课"}</Button>
          </form>
        </CardContent>
      </Card>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold">最近课程记录</h2><Select className="w-36 text-sm" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">全部瑜伽馆</option><option value="unassigned">未归属</option>{studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}</Select></div>
        {visibleRecords.length === 0 ? <EmptyState text="还没有课程记录，先记一节课吧～" /> : visibleRecords.slice(0, 12).map((record) => <ClassCard key={record.id} record={record} records={records} studios={studios} members={members} packages={packages} onEdit={startEdit} onDelete={removeRecord} />)}
      </section>
    </div>
  );
}

function PackageUsageHint({ usage, overuseWarning }: { usage: PackageUsage; overuseWarning: string }) {
  const tone = getPackageUsageTone(usage);
  const progress = usage.totalSessions > 0 ? Math.min(Math.max((usage.usedSessions / usage.totalSessions) * 100, 0), 100) : 0;

  return (
    <div className="space-y-2 rounded-3xl bg-card/80 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">已上 {usage.usedSessions} / {usage.totalSessions} 节</span>
        <span className={tone === "error" ? "font-medium text-destructive" : tone === "warning" ? "font-medium text-amber-700" : "font-medium text-primary"}>{getPackageUsageLabel(usage)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${progress}%` }} />
      </div>
      <p className={overuseWarning ? "text-sm text-amber-800" : "text-sm text-muted-foreground"}>{overuseWarning || getPackageFinishedMessage(usage)}</p>
    </div>
  );
}

function ClassCard({ record, records, studios, members, packages, onEdit, onDelete }: { record: ClassRecord; records: ClassRecord[]; studios: Studio[]; members: Member[]; packages: MemberPackage[]; onEdit: (record: ClassRecord) => void; onDelete: (record: ClassRecord) => void }) {
  const missingPrivatePackage = record.course_type === "private" && !record.package_id;
  const memberPackage = packages.find((p) => p.id === record.package_id);
  const usage = memberPackage ? calculatePackageUsageFromClasses(memberPackage, records) : null;
  return <article className="space-y-3 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="text-sm text-muted-foreground">{record.date}</div><h3 className="mt-1 font-medium">{record.course_name}</h3></div><Badge>{courseTypeLabels[record.course_type]}</Badge></div><div className="grid gap-1 text-sm text-muted-foreground"><span>{record.studio_id ? `归属：${studios.find((s) => s.id === record.studio_id)?.name ?? "瑜伽馆"}` : "未选择瑜伽馆"} · {record.hours} 课时</span>{record.member_id ? <span>会员：{members.find((m) => m.id === record.member_id)?.name ?? ""}</span> : null}{memberPackage ? <span>课包：{memberPackage.package_name}</span> : null}{usage ? <span>课包剩余：{getPackageUsageLabel(usage)}</span> : null}</div>{missingPrivatePackage ? <div className="flex gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800"><AlertCircle className="mt-0.5 size-4 shrink-0" />缺少课包，工资计算时可能需要补充。</div> : null}<div className="grid grid-cols-2 gap-2"><Button type="button" variant="secondary" size="sm" onClick={() => onEdit(record)}>编辑</Button><Button type="button" variant="outline" size="sm" onClick={() => onDelete(record)}>删除</Button></div></article>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{error ? <p className="text-sm text-destructive">{error}</p> : null}</div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function friendlyError(field: keyof FieldErrors, fallback: string) {
  const messages: FieldErrors = { teacher_id: "请先创建我的档案", course_name: "请输入课程名称", hours: "课时数需要大于 0", student_count: "学员人数不能小于 0", manual_fee: "手动课时费不能小于 0", date: "请选择日期", course_type: "请选择课程类型" };
  return messages[field] ?? fallback;
}
