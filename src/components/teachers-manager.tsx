"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { PenLine, Trash2, UserRoundPlus } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { countTeacherRelations, createDefaultTeacher, createTeacher, deleteTeacher, listTeachers, updateTeacher } from "@/lib/data";
import { mockTeachers } from "@/lib/mock-data";
import { getTeacherDeletePrompt } from "@/lib/relationPrompts";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createTeacherInputSchema } from "@/lib/validation";
import type { Teacher } from "@/types";

type TeacherForm = z.infer<typeof createTeacherInputSchema>;
type FieldErrors = Partial<Record<keyof TeacherForm, string>>;

const emptyForm: TeacherForm = {
  name: "",
  phone: "",
  note: ""
};

export function TeachersManager() {
  const [user, setUser] = useState<User | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [form, setForm] = useState<TeacherForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState("");
  const [tone, setTone] = useState<"success" | "warning" | "error">("success");
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
    }).catch(() => {
      setTone("error");
      setFeedback("网络好像开小差了，请再试一次～");
      setLoading(false);
    });
  }, []);

  function updateField(name: keyof TeacherForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function startEdit(teacher: Teacher) {
    setEditingId(teacher.id);
    setForm({
      name: teacher.name,
      phone: teacher.phone ?? "",
      note: teacher.note ?? ""
    });
    setFeedback("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createTeacherInputSchema.safeParse(form);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) nextErrors[issue.path[0] as keyof FieldErrors] = friendlyError(issue.message);
      setErrors(nextErrors);
      return;
    }
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以保存老师档案～");
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      if (editingId) {
        const updated = await updateTeacher(supabase, user.id, editingId, result.data);
        setTeachers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setFeedback("老师档案已更新～");
      } else {
        const created = await createTeacher(supabase, user.id, result.data);
        setTeachers((current) => [created, ...current]);
        setFeedback("老师档案已保存～");
      }
      setTone("success");
      resetForm();
    } catch {
      setTone("error");
      setFeedback("保存失败，请稍后再试～");
    }
  }

  async function createDefault() {
    if (!user || !isSupabaseConfigured()) return;
    try {
      const supabase = createBrowserSupabaseClient();
      const teacher = await createDefaultTeacher(supabase, user.id);
      setTeachers([teacher]);
      setTone("success");
      setFeedback("已创建你的老师档案～");
    } catch {
      setTone("error");
      setFeedback("保存失败，请稍后再试～");
    }
  }

  async function removeTeacher(teacher: Teacher) {
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以删除老师档案～");
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      const counts = await countTeacherRelations(supabase, user.id, teacher.id);
      if (!window.confirm(getTeacherDeletePrompt(counts))) return;
      await deleteTeacher(supabase, user.id, teacher.id);
      setTeachers((current) => current.filter((item) => item.id !== teacher.id));
      if (editingId === teacher.id) resetForm();
      setTone("success");
      setFeedback("老师档案已删除～");
    } catch {
      setTone("error");
      setFeedback("暂时不能删除，因为还有关联记录。可以先保留这个档案～");
    }
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">老师档案</p>
        <h1 className="text-2xl font-semibold tracking-normal">管理授课老师</h1>
        <p className="text-sm leading-6 text-muted-foreground">先把老师资料建好，记课、记业绩和工资计算都会更顺手。</p>
      </header>

      <Feedback message={feedback} tone={tone} />

      {!user ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">登录后可以保存和同步老师档案～</p>
            <Button asChild className="w-full">
              <Link href="/login">去登录</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {user && !loading && teachers.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">还没有老师，可以先创建一个默认档案，之后再慢慢补充。</p>
            <Button type="button" className="w-full" onClick={createDefault}>
              创建默认老师
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserRoundPlus className="size-5 text-primary" />
            {editingId ? "编辑老师" : "新增老师"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="姓名" error={errors.name}>
              <Input value={form.name} placeholder="例如：张老师" onChange={(event) => updateField("name", event.target.value)} />
            </Field>
            <Field label="手机号（可选）" error={errors.phone}>
              <Input value={form.phone ?? ""} inputMode="tel" placeholder="方便后续联系" onChange={(event) => updateField("phone", event.target.value)} />
            </Field>
            <Field label="备注（可选）" error={errors.note}>
              <Textarea value={form.note ?? ""} placeholder="例如：主带流瑜伽、私教" onChange={(event) => updateField("note", event.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {editingId ? (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  取消编辑
                </Button>
              ) : null}
              <Button type="submit" className={editingId ? "" : "col-span-2"}>
                {editingId ? "保存修改" : "保存老师"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">老师列表</h2>
        {teachers.length === 0 ? (
          <EmptyState text="还没有老师档案，先添加一位老师吧～" />
        ) : (
          teachers.map((teacher) => <TeacherCard key={teacher.id} teacher={teacher} onEdit={startEdit} onDelete={removeTeacher} />)
        )}
      </section>
    </div>
  );
}

function TeacherCard({ teacher, onEdit, onDelete }: { teacher: Teacher; onEdit: (teacher: Teacher) => void; onDelete: (teacher: Teacher) => void }) {
  return (
    <article className="space-y-3 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{teacher.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{teacher.phone || "未填写手机号"}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="icon" aria-label="编辑老师" onClick={() => onEdit(teacher)}>
            <PenLine className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label="删除老师" onClick={() => onDelete(teacher)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      {teacher.note ? <p className="rounded-2xl bg-secondary/70 px-3 py-2 text-sm text-muted-foreground">{teacher.note}</p> : null}
    </article>
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

function friendlyError(fallback: string) {
  return fallback === "请填写姓名" ? "请填写老师姓名" : fallback;
}
