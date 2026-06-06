"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { MapPin, PenLine, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { countStudioRelations, createStudio, deleteStudio, listStudios, updateStudio } from "@/lib/data";
import { mockStudios } from "@/lib/mock-data";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createStudioInputSchema } from "@/lib/validation";
import type { Studio } from "@/types";

type StudioForm = z.infer<typeof createStudioInputSchema>;
type FieldErrors = Partial<Record<keyof StudioForm, string>>;

const emptyForm: StudioForm = { name: "", contact_name: "", phone: "", address: "", note: "" };

export function StudiosManager() {
  const [user, setUser] = useState<User | null>(null);
  const [studios, setStudios] = useState<Studio[]>(mockStudios);
  const [form, setForm] = useState<StudioForm>(emptyForm);
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
      setStudios(await listStudios(supabase, currentUser.id));
    }).catch(() => {
      setTone("error");
      setFeedback("网络好像开小差了，请再试一次～");
    });
  }, []);

  function updateField(name: keyof StudioForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function startEdit(studio: Studio) {
    setEditingId(studio.id);
    setForm({
      name: studio.name,
      contact_name: studio.contact_name ?? "",
      phone: studio.phone ?? "",
      address: studio.address ?? "",
      note: studio.note ?? ""
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
    const result = createStudioInputSchema.safeParse(form);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) nextErrors[issue.path[0] as keyof FieldErrors] = issue.message;
      setErrors(nextErrors);
      return;
    }
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以保存瑜伽馆～");
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      if (editingId) {
        const updated = await updateStudio(supabase, user.id, editingId, result.data);
        setStudios((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setFeedback("瑜伽馆信息已更新～");
      } else {
        const created = await createStudio(supabase, user.id, result.data);
        setStudios((current) => [created, ...current]);
        setFeedback("瑜伽馆已添加～");
      }
      setTone("success");
      resetForm();
    } catch {
      setTone("error");
      setFeedback("保存失败，请稍后再试～");
    }
  }

  async function createFirstStudio() {
    setForm({ ...emptyForm, name: "我的常去瑜伽馆" });
  }

  async function removeStudio(studio: Studio) {
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以删除瑜伽馆～");
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      const counts = await countStudioRelations(supabase, user.id, studio.id);
      const hasRelations = Object.values(counts).some((count) => count > 0);
      const prompt = hasRelations
        ? "这个瑜伽馆已有课程、课包或工资规则，删除后可能影响历史数据。确定删除吗？"
        : "确定删除这个瑜伽馆吗？";
      if (!window.confirm(prompt)) return;
      await deleteStudio(supabase, user.id, studio.id);
      setStudios((current) => current.filter((item) => item.id !== studio.id));
      setTone("success");
      setFeedback("瑜伽馆已删除～");
    } catch {
      setTone("error");
      setFeedback("暂时不能删除，因为还有关联记录。可以先保留这个瑜伽馆～");
    }
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">工作地点</p>
        <h1 className="text-2xl font-semibold tracking-normal">瑜伽馆 / 工作地点</h1>
        <p className="text-sm leading-6 text-muted-foreground">记录你常去上课的瑜伽馆、工作室或私教场地，工资之后可以按地点区分。</p>
      </header>
      <Feedback message={feedback} tone={tone} />
      {!user ? (
        <Card><CardContent className="space-y-3 p-4"><p className="text-sm text-muted-foreground">登录后可以同步保存你的工作地点～</p><Button asChild className="w-full"><Link href="/login">去登录</Link></Button></CardContent></Card>
      ) : null}
      {user && studios.length === 0 ? (
        <Card><CardContent className="space-y-3 p-4"><p className="text-sm text-muted-foreground">还没有添加瑜伽馆，先记录你常去上课的地方吧～</p><Button className="w-full" onClick={createFirstStudio}>添加我的第一个瑜伽馆</Button></CardContent></Card>
      ) : null}

      <Card>
        <CardHeader className="p-4"><CardTitle className="flex items-center gap-2 text-lg"><Plus className="size-5 text-primary" />{editingId ? "编辑地点" : "新增地点"}</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="瑜伽馆名称" error={errors.name}><Input value={form.name} placeholder="例如：禅悦瑜伽馆" onChange={(event) => updateField("name", event.target.value)} /></Field>
            <Field label="联系人（可选）" error={errors.contact_name}><Input value={form.contact_name ?? ""} placeholder="例如：店长 Anna" onChange={(event) => updateField("contact_name", event.target.value)} /></Field>
            <Field label="联系电话（可选）" error={errors.phone}><Input value={form.phone ?? ""} inputMode="tel" onChange={(event) => updateField("phone", event.target.value)} /></Field>
            <Field label="地址（可选）" error={errors.address}><Input value={form.address ?? ""} onChange={(event) => updateField("address", event.target.value)} /></Field>
            <Field label="备注（可选）" error={errors.note}><Textarea value={form.note ?? ""} onChange={(event) => updateField("note", event.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              {editingId ? <Button type="button" variant="secondary" onClick={resetForm}>取消编辑</Button> : null}
              <Button type="submit" className={editingId ? "" : "col-span-2"}>{editingId ? "保存修改" : "保存地点"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">地点列表</h2>
        {studios.length === 0 ? <EmptyState text="还没有添加瑜伽馆，先记录你常去上课的地方吧～" /> : studios.map((studio) => <StudioCard key={studio.id} studio={studio} onEdit={startEdit} onDelete={removeStudio} />)}
      </section>
    </div>
  );
}

function StudioCard({ studio, onEdit, onDelete }: { studio: Studio; onEdit: (studio: Studio) => void; onDelete: (studio: Studio) => void }) {
  return (
    <article className="space-y-3 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><Link href={`/studios/${studio.id}`} className="font-medium text-foreground">{studio.name}</Link><p className="mt-1 text-sm text-muted-foreground">{studio.contact_name || studio.phone || "未填写联系人"}</p></div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="icon" aria-label="编辑地点" onClick={() => onEdit(studio)}><PenLine className="size-4" /></Button>
          <Button type="button" variant="outline" size="icon" aria-label="删除地点" onClick={() => onDelete(studio)}><Trash2 className="size-4" /></Button>
        </div>
      </div>
      {studio.address ? <p className="flex gap-2 rounded-2xl bg-secondary/70 px-3 py-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" />{studio.address}</p> : null}
      {studio.note ? <p className="text-sm text-muted-foreground">{studio.note}</p> : null}
    </article>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{error ? <p className="text-sm text-destructive">{error}</p> : null}</div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}
