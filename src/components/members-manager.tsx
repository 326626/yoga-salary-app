"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { PenLine, Search, Trash2, UserRoundPlus } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { countMemberRelations, createMember, deleteMember, listMembers, listPackages, listStudios, updateMember } from "@/lib/data";
import { mockMembers, mockPackages, mockStudios } from "@/lib/mock-data";
import { getMemberDeletePrompt } from "@/lib/relationPrompts";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createMemberInputSchema } from "@/lib/validation";
import type { Member, MemberPackage, Studio } from "@/types";

type MemberForm = z.infer<typeof createMemberInputSchema>;
type FieldErrors = Partial<Record<keyof MemberForm, string>>;

const emptyForm: MemberForm = {
  studio_id: mockStudios[0]?.id ?? "",
  name: "",
  phone: "",
  note: ""
};

export function MembersManager() {
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [packages, setPackages] = useState<MemberPackage[]>(mockPackages);
  const [studios, setStudios] = useState<Studio[]>(mockStudios);
  const [form, setForm] = useState<MemberForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [studioFilter, setStudioFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
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
      const [realMembers, realPackages, realStudios] = await Promise.all([listMembers(supabase, currentUser.id), listPackages(supabase, currentUser.id), listStudios(supabase, currentUser.id)]);
      setMembers(realMembers);
      setPackages(realPackages);
      setStudios(realStudios);
      setForm((current) => ({ ...current, studio_id: realStudios[0]?.id ?? "" }));
    }).catch(() => {
      setTone("error");
      setFeedback("网络好像开小差了，请再试一次～");
    });
  }, []);

  const visibleMembers = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    const studioMatched = members.filter((member) => studioFilter === "all" ? true : studioFilter === "unassigned" ? !member.studio_id : member.studio_id === studioFilter);
    if (!value) return studioMatched;
    return studioMatched.filter((member) => `${member.name}${member.phone ?? ""}${member.note ?? ""}`.toLowerCase().includes(value));
  }, [keyword, members, studioFilter]);

  function updateField(name: keyof MemberForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function startEdit(member: Member) {
    setEditingId(member.id);
    setIsFormOpen(true);
    setForm({
      studio_id: member.studio_id ?? "",
      name: member.name,
      phone: member.phone ?? "",
      note: member.note ?? ""
    });
    setFeedback("");
  }

  function resetForm() {
    setEditingId(null);
    setIsFormOpen(false);
    setForm({ ...emptyForm, studio_id: studios[0]?.id ?? "" });
    setErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createMemberInputSchema.safeParse(form);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) nextErrors[issue.path[0] as keyof FieldErrors] = friendlyError(issue.path[0] as keyof FieldErrors, issue.message);
      setErrors(nextErrors);
      return;
    }
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以保存会员资料～");
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      if (editingId) {
        const updated = await updateMember(supabase, user.id, editingId, result.data);
        setMembers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setFeedback("会员资料已更新～");
      } else {
        const created = await createMember(supabase, user.id, result.data);
        setMembers((current) => [created, ...current]);
        setFeedback("会员已添加～");
      }
      setTone("success");
      resetForm();
    } catch {
      setTone("error");
      setFeedback("保存失败，请稍后再试～");
    }
  }

  async function removeMember(member: Member) {
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以删除会员资料～");
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      const counts = await countMemberRelations(supabase, user.id, member.id);
      if (!window.confirm(getMemberDeletePrompt(counts))) return;
      await deleteMember(supabase, user.id, member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
      if (editingId === member.id) resetForm();
      setTone("success");
      setFeedback("会员资料已删除～");
    } catch {
      setTone("error");
      setFeedback("暂时不能删除，因为还有关联记录。可以先保留这个档案～");
    }
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">会员档案</p>
        <h1 className="text-2xl font-semibold tracking-normal">管理会员</h1>
        <p className="text-sm leading-6 text-muted-foreground">把常上课的会员轻轻记下来，私教课和课包就能自动关联。</p>
        <Button className="w-full" onClick={() => { setIsFormOpen(true); setEditingId(null); setForm({ ...emptyForm, studio_id: studios[0]?.id ?? "" }); }}>
          新增会员
        </Button>
      </header>

      <Feedback message={feedback} tone={tone} />

      {!user ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">登录后可以保存和同步会员资料～</p>
            <Button asChild className="w-full">
              <Link href="/login">去登录</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {user && studios.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">请先添加瑜伽馆，再添加会员～</p>
            <Button asChild className="w-full"><Link href="/studios">去添加瑜伽馆</Link></Button>
          </CardContent>
        </Card>
      ) : null}

      {isFormOpen ? <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserRoundPlus className="size-5 text-primary" />
            {editingId ? "编辑会员" : "新增会员"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="所属瑜伽馆" error={errors.studio_id}>
              <Select value={form.studio_id} onChange={(event) => updateField("studio_id", event.target.value)}>
                <option value="">请选择瑜伽馆</option>
                {studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}
              </Select>
            </Field>
            <Field label="姓名" error={errors.name}>
              <Input value={form.name} placeholder="例如：李女士" onChange={(event) => updateField("name", event.target.value)} />
            </Field>
            <Field label="手机号（可选）" error={errors.phone}>
              <Input value={form.phone ?? ""} inputMode="tel" placeholder="方便查找会员" onChange={(event) => updateField("phone", event.target.value)} />
            </Field>
            <Field label="备注（可选）" error={errors.note}>
              <Textarea value={form.note ?? ""} placeholder="例如：偏好晨练、私教 300 元/节" onChange={(event) => updateField("note", event.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {editingId ? (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  取消编辑
                </Button>
              ) : null}
              <Button type="submit" className={editingId ? "" : "col-span-2"} disabled={user !== null && studios.length === 0}>
                {editingId ? "保存修改" : "保存会员"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card> : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">会员列表</h2>
          <span className="text-sm text-muted-foreground">{visibleMembers.length} 位</span>
        </div>
        <Select value={studioFilter} onChange={(event) => setStudioFilter(event.target.value)}>
          <option value="all">全部瑜伽馆</option>
          <option value="unassigned">未归属</option>
          {studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}
        </Select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" value={keyword} placeholder="搜索姓名、手机号或备注" onChange={(event) => setKeyword(event.target.value)} />
        </div>
        {visibleMembers.length === 0 ? (
          <EmptyState text={members.length === 0 ? "还没有会员，先添加一个会员吧～" : "没有找到匹配的会员，换个关键词试试～"} />
        ) : (
          visibleMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              packageCount={packages.filter((item) => item.member_id === member.id).length}
              studioName={studios.find((studio) => studio.id === member.studio_id)?.name ?? "未选择瑜伽馆"}
              onEdit={startEdit}
              onDelete={removeMember}
            />
          ))
        )}
      </section>
    </div>
  );
}

function MemberCard({ member, packageCount, studioName, onEdit, onDelete }: { member: Member; packageCount: number; studioName: string; onEdit: (member: Member) => void; onDelete: (member: Member) => void }) {
  return (
    <article className="space-y-3 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/members/${member.id}`} className="font-medium text-foreground">
            {member.name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">{studioName} · {member.phone || "未填写手机号"}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="icon" aria-label="编辑会员" onClick={() => onEdit(member)}>
            <PenLine className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label="删除会员" onClick={() => onDelete(member)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-secondary px-3 py-1 text-muted-foreground">{packageCount} 个课包</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href={`/packages?memberId=${member.id}`}>添加课包</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/classes?memberId=${member.id}&courseType=private`}>记录私教课</Link>
        </Button>
      </div>
      {member.note ? <p className="rounded-2xl bg-secondary/70 px-3 py-2 text-sm text-muted-foreground">{member.note}</p> : null}
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

function friendlyError(field: keyof FieldErrors, fallback: string) {
  if (field === "studio_id") return "请选择所属瑜伽馆";
  return fallback === "请填写姓名" ? "请填写会员姓名" : fallback;
}
