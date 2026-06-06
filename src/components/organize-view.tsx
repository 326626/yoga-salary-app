"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Archive, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Select } from "@/components/ui/select";
import { assignClassesToStudio, assignPackagesToStudio, assignPerformancesToStudio, listMembers, listPackages, listStudios, listUnassignedRecords } from "@/lib/data";
import { mockMembers, mockPackages, mockStudios } from "@/lib/mock-data";
import { formatMoney } from "@/lib/salary/formatMoney";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ClassRecord, Member, MemberPackage, Performance, Studio } from "@/types";

type Selection = {
  classes: string[];
  performances: string[];
  packages: string[];
};

const emptySelection: Selection = { classes: [], performances: [], packages: [] };
const courseTypeLabels: Record<string, string> = { group: "团课", private: "私教", trial: "体验课", substitute: "代课", other: "其他" };
const performanceTypeLabels: Record<string, string> = { new_card: "新办卡", renewal: "续费", private_package: "私教包", product: "商品", other: "其他" };

export function OrganizeView() {
  const [user, setUser] = useState<User | null>(null);
  const [studios, setStudios] = useState<Studio[]>(mockStudios);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [allPackages, setAllPackages] = useState<MemberPackage[]>(mockPackages);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [packages, setPackages] = useState<MemberPackage[]>([]);
  const [studioId, setStudioId] = useState("");
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [feedback, setFeedback] = useState("");
  const [tone, setTone] = useState<"success" | "warning" | "error">("success");
  const [loading, setLoading] = useState(false);

  async function loadData(currentUser: User) {
    const supabase = createBrowserSupabaseClient();
    const [realStudios, realMembers, realPackages, unassigned] = await Promise.all([
      listStudios(supabase, currentUser.id),
      listMembers(supabase, currentUser.id),
      listPackages(supabase, currentUser.id),
      listUnassignedRecords(supabase, currentUser.id)
    ]);
    setStudios(realStudios);
    setMembers(realMembers);
    setAllPackages(realPackages);
    setClasses(unassigned.classes);
    setPerformances(unassigned.performances);
    setPackages(unassigned.packages);
    setStudioId((current) => (realStudios.some((studio) => studio.id === current) ? current : realStudios[0]?.id ?? ""));
    setSelection(emptySelection);
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) await loadData(currentUser);
    }).catch(() => {
      setTone("error");
      setFeedback("网络好像开小差了，请再试一次～");
    });
  }, []);

  const counts = useMemo(() => ({
    classes: classes.length,
    performances: performances.length,
    packages: packages.length,
    total: classes.length + performances.length + packages.length
  }), [classes.length, packages.length, performances.length]);

  const selectedCount = selection.classes.length + selection.performances.length + selection.packages.length;

  function toggle(group: keyof Selection, id: string) {
    setSelection((current) => ({
      ...current,
      [group]: current[group].includes(id) ? current[group].filter((item) => item !== id) : [...current[group], id]
    }));
  }

  function toggleAll(group: keyof Selection, ids: string[]) {
    setSelection((current) => ({
      ...current,
      [group]: current[group].length === ids.length ? [] : ids
    }));
  }

  async function assignSelected() {
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以整理归属～");
      return;
    }
    if (!studioId) {
      setTone("warning");
      setFeedback("先选择一个瑜伽馆～");
      return;
    }
    if (selectedCount === 0) {
      setTone("warning");
      setFeedback("先选择要整理的记录～");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      await Promise.all([
        assignClassesToStudio(supabase, user.id, selection.classes, studioId),
        assignPerformancesToStudio(supabase, user.id, selection.performances, studioId),
        assignPackagesToStudio(supabase, user.id, selection.packages, studioId)
      ]);
      await loadData(user);
      setTone("success");
      setFeedback("这些记录已经整理好啦～");
    } catch {
      setTone("error");
      setFeedback("整理失败，请稍后再试～");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">整理后工资会更清楚～</p>
        <h1 className="text-2xl font-semibold tracking-normal">整理归属</h1>
      </header>
      <Feedback message={feedback} tone={tone} />

      <Card className="bg-gradient-to-br from-secondary via-card to-accent">
        <CardContent className="space-y-3 p-5">
          <Archive className="size-6 text-primary" />
          <h2 className="text-lg font-semibold">整理旧记录归属</h2>
          <p className="text-sm leading-6 text-muted-foreground">选择这些记录属于哪个瑜伽馆，之后就可以按地点计算工资啦～</p>
        </CardContent>
      </Card>

      {!user ? <Card><CardContent className="space-y-3 p-4"><p className="text-sm text-muted-foreground">登录后可以整理你的真实记录～</p><Button asChild className="w-full"><Link href="/login">去登录</Link></Button></CardContent></Card> : null}

      <div className="grid grid-cols-3 gap-2">
        <Stat label="未归属课程" value={counts.classes} />
        <Stat label="未归属业绩" value={counts.performances} />
        <Stat label="未归属课包" value={counts.packages} />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          {studios.length === 0 ? (
            <div className="space-y-3"><p className="text-sm text-muted-foreground">还没有瑜伽馆，先添加一个再整理归属～</p><Button asChild className="w-full"><Link href="/studios">先添加瑜伽馆</Link></Button></div>
          ) : (
            <>
              <Select value={studioId} onChange={(event) => setStudioId(event.target.value)}>{studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}</Select>
              <Button className="w-full" onClick={assignSelected} disabled={loading}>{loading ? "正在整理～" : "归属到这个瑜伽馆"}</Button>
            </>
          )}
        </CardContent>
      </Card>

      {counts.total === 0 ? <Empty text="所有记录都整理好啦～" /> : null}
      <RecordSection title="未归属课程" ids={classes.map((item) => item.id)} selected={selection.classes} onToggleAll={() => toggleAll("classes", classes.map((item) => item.id))}>
        {classes.map((item) => <Selectable key={item.id} checked={selection.classes.includes(item.id)} onClick={() => toggle("classes", item.id)}><ClassCard record={item} members={members} packages={allPackages} /></Selectable>)}
      </RecordSection>
      <RecordSection title="未归属业绩" ids={performances.map((item) => item.id)} selected={selection.performances} onToggleAll={() => toggleAll("performances", performances.map((item) => item.id))}>
        {performances.map((item) => <Selectable key={item.id} checked={selection.performances.includes(item.id)} onClick={() => toggle("performances", item.id)}><PerformanceCard record={item} members={members} /></Selectable>)}
      </RecordSection>
      <RecordSection title="未归属课包" ids={packages.map((item) => item.id)} selected={selection.packages} onToggleAll={() => toggleAll("packages", packages.map((item) => item.id))}>
        {packages.map((item) => <Selectable key={item.id} checked={selection.packages.includes(item.id)} onClick={() => toggle("packages", item.id)}><PackageCard record={item} members={members} /></Selectable>)}
      </RecordSection>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-3xl border border-white/70 bg-card/90 p-3 text-center shadow-sm"><div className="text-xl font-semibold text-primary">{value}</div><div className="mt-1 text-xs text-muted-foreground">{label}</div></div>;
}

function RecordSection({ title, ids, selected, onToggleAll, children }: { title: string; ids: string[]; selected: string[]; onToggleAll: () => void; children: React.ReactNode }) {
  if (ids.length === 0) return null;
  return <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-base font-semibold">{title}</h2><Button variant="secondary" size="sm" onClick={onToggleAll}>{selected.length === ids.length ? "取消全选" : "全选"}</Button></div>{children}</section>;
}

function Selectable({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="block w-full text-left" onClick={onClick}><div className={checked ? "rounded-3xl ring-2 ring-primary" : ""}>{children}</div></button>;
}

function ClassCard({ record, members, packages }: { record: ClassRecord; members: Member[]; packages: MemberPackage[] }) {
  return <article className="space-y-2 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm"><div className="flex justify-between gap-3"><div><p className="text-sm text-muted-foreground">{record.date}</p><h3 className="font-medium">{record.course_name}</h3></div><Badge>{courseTypeLabels[record.course_type]}</Badge></div><p className="text-sm text-muted-foreground">{record.hours} 课时 · {members.find((item) => item.id === record.member_id)?.name ?? "未关联会员"}</p>{record.package_id ? <p className="text-sm text-muted-foreground">课包：{packages.find((item) => item.id === record.package_id)?.package_name ?? ""}</p> : null}</article>;
}

function PerformanceCard({ record, members }: { record: Performance; members: Member[] }) {
  const customer = record.customer_name || members.find((item) => item.id === record.member_id)?.name || "未填写客户";
  return <article className="space-y-2 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm"><div className="flex justify-between gap-3"><div><p className="text-sm text-muted-foreground">{record.date}</p><h3 className="font-medium">{performanceTypeLabels[record.type]}</h3></div><div className="font-semibold text-primary">¥{formatMoney(record.amount)}</div></div><p className="text-sm text-muted-foreground">{customer} · {record.commissionable ? "计入提成" : "不计提成"}</p></article>;
}

function PackageCard({ record, members }: { record: MemberPackage; members: Member[] }) {
  return <article className="space-y-2 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm"><p className="text-sm text-muted-foreground">{members.find((item) => item.id === record.member_id)?.name ?? "会员"}</p><h3 className="font-medium">{record.package_name}</h3><div className="grid grid-cols-3 gap-2 text-sm"><Stat label="成交价" value={record.total_amount} /><Stat label="课时" value={record.total_sessions} /><Stat label="单节" value={record.unit_price} /></div></article>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}
