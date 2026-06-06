"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { PenLine, ShoppingBag, Trash2 } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculatePackageUsageFromClasses, calculateUnitPrice, countPackageRelations, createMemberPackage, deleteMemberPackage, listClasses, listMembers, listPackages, listStudios, listTeachers, updateMemberPackage, type PackageUsage } from "@/lib/data";
import { mockClasses, mockMembers, mockPackages, mockStudios, mockTeachers } from "@/lib/mock-data";
import { getPackageUsageLabel, getPackageUsageTone } from "@/lib/packages/usageDisplay";
import { getPackageDeletePrompt } from "@/lib/relationPrompts";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createMemberPackageInputSchema } from "@/lib/validation";
import type { ClassRecord, CourseType, Member, MemberPackage, Studio, Teacher } from "@/types";

type PackageForm = Omit<z.input<typeof createMemberPackageInputSchema>, "total_amount" | "total_sessions"> & {
  total_amount: string;
  total_sessions: string;
};
type FieldErrors = Partial<Record<keyof PackageForm, string>>;

const courseTypeLabels: Record<CourseType, string> = {
  group: "团课",
  private: "私教",
  trial: "体验课",
  substitute: "代课",
  other: "其他"
};
const todayString = () => new Date().toISOString().slice(0, 10);
const initialForm = (): PackageForm => ({
  member_id: mockMembers[0]?.id ?? "",
  teacher_id: "",
  studio_id: mockStudios[0]?.id ?? "",
  package_name: "",
  course_type: "private",
  total_amount: "",
  total_sessions: "",
  purchase_date: todayString(),
  note: ""
});

export function PackagesManager({ initialMemberId, initialEditId, initialStudioId }: { initialMemberId?: string; initialEditId?: string; initialStudioId?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [studios, setStudios] = useState<Studio[]>(mockStudios);
  const [packages, setPackages] = useState<MemberPackage[]>(mockPackages);
  const [classes, setClasses] = useState<ClassRecord[]>(mockClasses);
  const [form, setForm] = useState<PackageForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState("");
  const [tone, setTone] = useState<"success" | "warning" | "error">("success");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) return;
      const [realMembers, realTeachers, realStudios, realPackages, realClasses] = await Promise.all([
        listMembers(supabase, currentUser.id),
        listTeachers(supabase, currentUser.id),
        listStudios(supabase, currentUser.id),
        listPackages(supabase, currentUser.id),
        listClasses(supabase, currentUser.id)
      ]);
      setMembers(realMembers);
      setTeachers(realTeachers);
      setStudios(realStudios);
      setPackages(realPackages);
      setClasses(realClasses);
      const preferredMemberId = realMembers.some((member) => member.id === initialMemberId) ? initialMemberId : realMembers[0]?.id;
      const preferredStudioId = realStudios.some((studio) => studio.id === initialStudioId) ? initialStudioId : realStudios[0]?.id;
      setForm((current) => ({ ...current, member_id: preferredMemberId ?? "", studio_id: preferredStudioId ?? "" }));
    }).catch(() => {
      setTone("error");
      setFeedback("网络好像开小差了，请再试一次～");
    });
  }, [initialMemberId, initialStudioId]);

  useEffect(() => {
    if (user) return;
    if (initialMemberId && members.some((member) => member.id === initialMemberId)) {
      setForm((current) => ({ ...current, member_id: initialMemberId }));
    }
    if (initialStudioId && studios.some((studio) => studio.id === initialStudioId)) {
      setForm((current) => ({ ...current, studio_id: initialStudioId }));
    }
  }, [initialMemberId, initialStudioId, members, studios, user]);

  useEffect(() => {
    if (!initialEditId || editingId === initialEditId) return;
    const item = packages.find((record) => record.id === initialEditId);
    if (item) startEdit(item);
  }, [editingId, initialEditId, packages]);

  const unitPricePreview = useMemo(() => {
    const totalAmount = Number(form.total_amount);
    const totalSessions = Number(form.total_sessions);
    if (!Number.isFinite(totalAmount) || !Number.isFinite(totalSessions) || totalSessions <= 0) return 0;
    return calculateUnitPrice(totalAmount, totalSessions);
  }, [form.total_amount, form.total_sessions]);
  const usages = useMemo(
    () => Object.fromEntries(packages.map((item) => [item.id, calculatePackageUsageFromClasses(item, classes)])),
    [classes, packages]
  );

  function updateField(name: keyof PackageForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function startEdit(item: MemberPackage) {
    setEditingId(item.id);
    setForm({
      member_id: item.member_id,
      teacher_id: item.teacher_id ?? "",
      studio_id: item.studio_id ?? "",
      package_name: item.package_name,
      course_type: item.course_type,
      total_amount: String(item.total_amount),
      total_sessions: String(item.total_sessions),
      purchase_date: item.purchase_date,
      note: item.note ?? ""
    });
    setFeedback("");
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...initialForm(), member_id: members[0]?.id ?? "" });
    setErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createMemberPackageInputSchema.safeParse(form);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) nextErrors[issue.path[0] as keyof FieldErrors] = friendlyError(issue.path[0] as keyof FieldErrors, issue.message);
      setErrors(nextErrors);
      return;
    }
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以保存课包～");
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      if (editingId) {
        const updated = await updateMemberPackage(supabase, user.id, editingId, result.data);
        setPackages((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setFeedback("课包已更新～");
      } else {
        const created = await createMemberPackage(supabase, user.id, result.data);
        setPackages((current) => [created, ...current]);
        setFeedback(initialMemberId ? "课包已添加～" : "课包已保存，单节成交价也算好啦～");
      }
      setTone("success");
      resetForm();
    } catch {
      setTone("error");
      setFeedback("保存失败，请稍后再试～");
    }
  }

  async function removePackage(item: MemberPackage) {
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以删除课包～");
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      const counts = await countPackageRelations(supabase, user.id, item.id);
      if (!window.confirm(getPackageDeletePrompt(counts))) return;
      await deleteMemberPackage(supabase, user.id, item.id);
      setPackages((current) => current.filter((record) => record.id !== item.id));
      if (editingId === item.id) resetForm();
      setTone("success");
      setFeedback("课包已删除～");
    } catch {
      setTone("error");
      setFeedback("暂时不能删除，因为还有关联记录。可以先保留这个课包～");
    }
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">课包 / 订单</p>
        <h1 className="text-2xl font-semibold tracking-normal">管理会员课包</h1>
        <p className="text-sm leading-6 text-muted-foreground">记录成交价和课时数，私教课工资就能按单节成交价自动计算。</p>
      </header>

      <Feedback message={feedback} tone={tone} />

      {!user ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">登录后可以保存和同步课包～</p>
            <Button asChild className="w-full">
              <Link href="/login">去登录</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {user && members.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">请先添加会员，再创建课包～</p>
            <Button asChild className="w-full">
              <Link href="/members">去添加会员</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="size-5 text-primary" />
            {editingId ? "编辑课包" : "新增课包"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="会员" error={errors.member_id}>
              <Select value={form.member_id} onChange={(event) => updateField("member_id", event.target.value)}>
                <option value="">请选择会员</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="课包名称" error={errors.package_name}>
              <Input value={form.package_name} placeholder="例如：私教 10 节" onChange={(event) => updateField("package_name", event.target.value)} />
            </Field>
            <Field label="这个课包属于哪个瑜伽馆？" error={errors.studio_id}>
              <Select value={form.studio_id ?? ""} onChange={(event) => updateField("studio_id", event.target.value)}>
                <option value="">不选择</option>
                {studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="课程类型" error={errors.course_type}>
                <Select value={form.course_type} onChange={(event) => updateField("course_type", event.target.value)}>
                  {Object.entries(courseTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="关联老师（可选）" error={errors.teacher_id}>
                <Select value={form.teacher_id ?? ""} onChange={(event) => updateField("teacher_id", event.target.value)}>
                  <option value="">不选择</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="成交价" error={errors.total_amount}>
                <Input type="number" min="0" inputMode="decimal" value={form.total_amount} placeholder="3000" onChange={(event) => updateField("total_amount", event.target.value)} />
              </Field>
              <Field label="总课时" error={errors.total_sessions}>
                <Input type="number" min="0" inputMode="numeric" value={form.total_sessions} placeholder="10" onChange={(event) => updateField("total_sessions", event.target.value)} />
              </Field>
            </div>
            <div className="rounded-3xl bg-accent px-4 py-3 text-sm text-primary">
              单节成交价预览：<span className="font-semibold">¥{unitPricePreview.toFixed(2)}</span>
            </div>
            <Field label="购买日期" error={errors.purchase_date}>
              <Input type="date" value={form.purchase_date} onChange={(event) => updateField("purchase_date", event.target.value)} />
            </Field>
            <Field label="备注（可选）" error={errors.note}>
              <Textarea value={form.note ?? ""} placeholder="例如：会员偏好、赠课说明" onChange={(event) => updateField("note", event.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {editingId ? (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  取消编辑
                </Button>
              ) : null}
              <Button type="submit" className={editingId ? "" : "col-span-2"} disabled={user !== null && members.length === 0}>
                {editingId ? "保存修改" : "保存课包"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">课包列表</h2>
        {packages.length === 0 ? (
          <EmptyState text="还没有课包，私教课建议先添加课包～" />
        ) : (
            packages.map((item) => <PackageCard key={item.id} item={item} members={members} teachers={teachers} studios={studios} usage={usages[item.id]} onEdit={startEdit} onDelete={removePackage} />)
        )}
      </section>
    </div>
  );
}

function PackageCard({
  item,
  members,
  teachers,
  studios,
  usage,
  onEdit,
  onDelete
}: {
  item: MemberPackage;
  members: Member[];
  teachers: Teacher[];
  studios: Studio[];
  usage?: PackageUsage;
  onEdit: (item: MemberPackage) => void;
  onDelete: (item: MemberPackage) => void;
}) {
  const memberName = members.find((member) => member.id === item.member_id)?.name ?? "会员";
  const teacherName = teachers.find((teacher) => teacher.id === item.teacher_id)?.name;
  const studioName = studios.find((studio) => studio.id === item.studio_id)?.name;

  return (
    <article className="space-y-4 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{memberName}</p>
          <Link href={`/packages/${item.id}`} className="mt-1 block font-medium text-foreground">
            {item.package_name}
          </Link>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="icon" aria-label="编辑课包" onClick={() => onEdit(item)}>
            <PenLine className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label="删除课包" onClick={() => onDelete(item)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge>{courseTypeLabels[item.course_type]}</Badge>
        {teacherName ? <Badge>{teacherName}</Badge> : null}
        {studioName ? <Badge>{studioName}</Badge> : null}
        <Badge>{item.purchase_date}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <AmountPill label="成交价" value={`¥${item.total_amount.toFixed(2)}`} />
        <AmountPill label="课时" value={`${item.total_sessions}`} />
        <AmountPill label="单节" value={`¥${item.unit_price.toFixed(2)}`} strong />
      </div>
      {usage ? <UsageStrip usage={usage} /> : null}
      {item.course_type === "private" ? <p className="rounded-2xl bg-secondary/70 px-3 py-2 text-sm text-muted-foreground">私教工资会优先使用这个单节成交价。</p> : null}
      <Button asChild variant="secondary" className="w-full">
        <Link href={`/classes?memberId=${item.member_id}&packageId=${item.id}&teacherId=${item.teacher_id ?? ""}&courseType=private`}>用这个课包记一节课</Link>
      </Button>
      {item.note ? <p className="text-sm text-muted-foreground">{item.note}</p> : null}
    </article>
  );
}

function UsageStrip({ usage }: { usage: PackageUsage }) {
  const progress = usage.totalSessions > 0 ? Math.min(Math.max((usage.usedSessions / usage.totalSessions) * 100, 0), 100) : 0;
  const tone = getPackageUsageTone(usage);

  return (
    <div className="space-y-2 rounded-3xl bg-secondary/70 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">已上 {usage.usedSessions} 节</span>
        <span className={tone === "error" ? "font-medium text-destructive" : tone === "warning" ? "font-medium text-amber-700" : "font-medium text-primary"}>{getPackageUsageLabel(usage)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-card/80">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function AmountPill({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={strong ? "font-semibold text-primary" : "font-semibold"}>{value}</div>
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

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function friendlyError(field: keyof FieldErrors, fallback: string) {
  const messages: FieldErrors = {
    member_id: "请选择会员",
    package_name: "请输入课包名称",
    course_type: "请选择课程类型",
    total_amount: "成交价不能小于 0",
    total_sessions: "总课时需要大于 0",
    purchase_date: "请选择购买日期"
  };
  return messages[field] ?? fallback;
}
