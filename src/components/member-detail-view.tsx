"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, BookOpenCheck, CreditCard, ReceiptText, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculatePackageUsageFromClasses, createMemberPackage, getMemberDetail, listClassesByMember, listPackages, listPerformancesByMember, listStudios, type PackageUsage } from "@/lib/data";
import { mockClasses, mockMembers, mockPackages, mockPerformances, mockStudios } from "@/lib/mock-data";
import { getPackageUsageLabel, getPackageUsageTone } from "@/lib/packages/usageDisplay";
import { formatMoney } from "@/lib/salary/formatMoney";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createMemberPackageInputSchema } from "@/lib/validation";
import type { ClassRecord, Member, MemberPackage, Performance, Studio } from "@/types";

const courseTypeLabels: Record<string, string> = { group: "团课", private: "私教", trial: "体验课", substitute: "代课", other: "其他" };
const performanceTypeLabels: Record<string, string> = { new_card: "新办卡", renewal: "续费", private_package: "私教包", product: "商品", other: "其他" };
const todayString = () => new Date().toISOString().slice(0, 10);
const tabs = ["课包记录", "私教课记录", "业绩记录"] as const;
type MemberDetailTab = (typeof tabs)[number];
type MemberPackageMiniFormState = {
  member_id: string;
  teacher_id: string;
  studio_id: string;
  pricing_mode: string;
  package_name: string;
  course_type: string;
  total_amount: string;
  unit_price: string;
  total_sessions: string;
  purchase_date: string;
  note: string;
};

export function MemberDetailView({ memberId }: { memberId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(mockMembers.find((item) => item.id === memberId) ?? null);
  const [packages, setPackages] = useState<MemberPackage[]>(mockPackages.filter((item) => item.member_id === memberId));
  const [studios, setStudios] = useState<Studio[]>(mockStudios);
  const [classes, setClasses] = useState<ClassRecord[]>(mockClasses.filter((item) => item.member_id === memberId));
  const [performances, setPerformances] = useState<Performance[]>(mockPerformances.filter((item) => item.member_id === memberId));
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<MemberDetailTab>("课包记录");
  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);
  const [packageForm, setPackageForm] = useState<MemberPackageMiniFormState>({
    member_id: memberId,
    teacher_id: "",
    studio_id: "",
    pricing_mode: "total_amount",
    package_name: "",
    course_type: "private",
    total_amount: "",
    unit_price: "",
    total_sessions: "",
    purchase_date: todayString(),
    note: ""
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setMessage("当前是体验数据，登录后可以查看你自己的会员详情。");
        return;
      }
      const [realMember, allPackages, realClasses, realPerformances, realStudios] = await Promise.all([
        getMemberDetail(supabase, currentUser.id, memberId),
        listPackages(supabase, currentUser.id),
        listClassesByMember(supabase, currentUser.id, memberId),
        listPerformancesByMember(supabase, currentUser.id, memberId),
        listStudios(supabase, currentUser.id)
      ]);
      setMember(realMember);
      setPackages(allPackages.filter((item) => item.member_id === memberId));
      setClasses(realClasses);
      setPerformances(realPerformances);
      setStudios(realStudios);
      setPackageForm((current) => ({ ...current, member_id: memberId, studio_id: realMember?.studio_id ?? "" }));
    }).catch(() => setMessage("网络好像开小差了，请再试一次～"));
  }, [memberId]);

  function updatePackageField(name: keyof typeof packageForm, value: string) {
    setPackageForm((current) => ({ ...current, [name]: value }));
  }

  function resetPackageForm(studioId = member?.studio_id ?? "") {
    setPackageForm({
      member_id: memberId,
      teacher_id: "",
      studio_id: studioId,
      pricing_mode: "total_amount",
      package_name: "",
      course_type: "private",
      total_amount: "",
      unit_price: "",
      total_sessions: "",
      purchase_date: todayString(),
      note: ""
    });
    setIsPackageFormOpen(false);
  }

  async function handleCreatePackage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createMemberPackageInputSchema.safeParse(packageForm);
    if (!result.success) {
      setMessage("请把课包信息填写完整～");
      return;
    }
    if (!user || !isSupabaseConfigured()) {
      setMessage("登录后可以保存课包～");
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      const created = await createMemberPackage(supabase, user.id, result.data);
      setPackages((current) => [created, ...current]);
      setMessage("课包已添加～");
      resetPackageForm(created.studio_id ?? member?.studio_id ?? "");
    } catch {
      setMessage("保存失败，请稍后再试～");
    }
  }

  if (!member) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" className="px-0">
          <Link href="/members"><ArrowLeft className="mr-2 size-4" />返回会员</Link>
        </Button>
        <Card>
          <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
            <p>没有找到这位会员，可能已经删除或不属于当前账号。</p>
            {!user ? <Button asChild className="w-full"><Link href="/login">去登录</Link></Button> : null}
          </CardContent>
        </Card>
      </div>
    );
  }
  const studioName = studios.find((studio) => studio.id === member.studio_id)?.name ?? "未选择瑜伽馆";

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" className="px-0">
        <Link href="/members"><ArrowLeft className="mr-2 size-4" />返回会员</Link>
      </Button>

      <Card className="bg-gradient-to-br from-secondary via-card to-accent">
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-sm text-muted-foreground">会员详情</p>
            <h1 className="mt-2 text-2xl font-semibold">{member.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{studioName} · {member.phone || "未填写手机号"}</p>
          </div>
          {!member.studio_id ? <p className="rounded-3xl bg-amber-50 p-3 text-sm text-amber-800">补充所属瑜伽馆后，工资和课包会更清楚～</p> : null}
          {member.note ? <p className="rounded-3xl bg-card/70 p-3 text-sm text-muted-foreground">{member.note}</p> : null}
          {message ? <p className="rounded-3xl bg-card/70 p-3 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 rounded-2xl bg-muted p-1">
        {tabs.map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? "min-h-11 rounded-xl bg-card text-sm font-medium text-primary shadow-sm" : "min-h-11 rounded-xl text-sm font-medium text-muted-foreground"} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>
      <Feedback message={message.includes("体验数据") ? "" : message} tone={message.includes("失败") ? "error" : "success"} />

      {activeTab === "课包记录" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle icon={ShoppingBag} title="课包记录" />
            {!isPackageFormOpen ? <Button size="sm" onClick={() => setIsPackageFormOpen(true)}>新增课包</Button> : null}
          </div>
          {isPackageFormOpen ? <MemberPackageMiniForm form={packageForm} onChange={updatePackageField} onCancel={() => resetPackageForm()} onSubmit={handleCreatePackage} /> : null}
          {packages.length === 0 ? <Empty text="还没有课包，可以先给她添加一个～" /> : packages.map((item) => <PackageRow key={item.id} item={item} usage={calculatePackageUsageFromClasses(item, classes)} />)}
        </section>
      ) : null}

      {activeTab === "私教课记录" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle icon={BookOpenCheck} title="私教课记录" />
            <Button asChild size="sm"><Link href={`/classes?memberId=${member.id}&studioId=${member.studio_id ?? ""}&courseType=private`}>新增私教课</Link></Button>
          </div>
          {classes.length === 0 ? <Empty text="还没有私教课记录。" /> : classes.filter((item) => item.course_type === "private").slice(0, 8).map((item) => (
        <article key={item.id} className="rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm text-muted-foreground">{item.date}</p><h3 className="mt-1 font-medium">{item.course_name}</h3></div>
            <Badge>{courseTypeLabels[item.course_type]}</Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{item.hours} 课时 · {item.student_count} 人</p>
        </article>
          ))}
        </section>
      ) : null}

      {activeTab === "业绩记录" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle icon={ReceiptText} title="业绩记录" />
            <Button asChild size="sm"><Link href={`/performances?memberId=${member.id}&studioId=${member.studio_id ?? ""}`}>新增业绩</Link></Button>
          </div>
          {performances.length === 0 ? <Empty text="还没有相关业绩记录。" /> : performances.slice(0, 8).map((item) => (
        <article key={item.id} className="rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm text-muted-foreground">{item.date}</p><h3 className="mt-1 font-medium">{performanceTypeLabels[item.type]}</h3></div>
            <div className="font-semibold text-primary">¥{formatMoney(item.amount)}</div>
          </div>
          {!item.commissionable ? <p className="mt-3 rounded-2xl bg-secondary/70 px-3 py-2 text-sm text-muted-foreground">不计提成</p> : null}
        </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function MemberPackageMiniForm({ form, onChange, onCancel, onSubmit }: { form: MemberPackageMiniFormState; onChange: (name: keyof MemberPackageMiniFormState, value: string) => void; onCancel: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const totalSessions = Number(form.total_sessions);
  const totalAmount = form.pricing_mode === "unit_price" ? Number(form.unit_price || 0) * (Number.isFinite(totalSessions) ? totalSessions : 0) : Number(form.total_amount || 0);
  const unitPrice = form.pricing_mode === "unit_price" ? Number(form.unit_price || 0) : totalSessions > 0 ? totalAmount / totalSessions : 0;

  return (
    <Card>
      <CardHeader className="p-4"><CardTitle className="text-lg">新增课包</CardTitle></CardHeader>
      <CardContent className="p-4 pt-0">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="课包名称"><Input value={form.package_name} placeholder="例如：私教 10 节" onChange={(event) => onChange("package_name", event.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="录入方式"><Select value={form.pricing_mode} onChange={(event) => onChange("pricing_mode", event.target.value)}><option value="total_amount">按总价计算</option><option value="unit_price">按客单价计算</option></Select></Field>
            <Field label="总课时"><Input type="number" inputMode="decimal" value={form.total_sessions} onChange={(event) => onChange("total_sessions", event.target.value)} /></Field>
          </div>
          {form.pricing_mode === "unit_price" ? <Field label="客单价 / 单节成交价"><Input type="number" inputMode="decimal" value={form.unit_price} onChange={(event) => onChange("unit_price", event.target.value)} /></Field> : <Field label="总成交金额"><Input type="number" inputMode="decimal" value={form.total_amount} onChange={(event) => onChange("total_amount", event.target.value)} /></Field>}
          <div className="rounded-3xl bg-accent px-4 py-3 text-sm text-primary">总成交金额：¥{formatMoney(Number.isFinite(totalAmount) ? totalAmount : 0)} · 单节：¥{formatMoney(Number.isFinite(unitPrice) ? unitPrice : 0)}</div>
          <Field label="购买日期"><Input type="date" value={form.purchase_date} onChange={(event) => onChange("purchase_date", event.target.value)} /></Field>
          <Field label="备注（可选）"><Textarea value={form.note} onChange={(event) => onChange("note", event.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3"><Button type="button" variant="secondary" onClick={onCancel}>取消</Button><Button type="submit">保存课包</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

function PackageRow({ item, usage }: { item: MemberPackage; usage: PackageUsage }) {
  return (
    <article className="space-y-3 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/packages/${item.id}`} className="font-medium text-foreground">{item.package_name}</Link>
          <p className="mt-1 text-sm text-muted-foreground">{courseTypeLabels[item.course_type]} · {item.purchase_date}</p>
        </div>
        <CreditCard className="size-5 text-primary" />
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Pill label="成交价" value={`¥${formatMoney(item.total_amount)}`} />
        <Pill label="课时" value={`${item.total_sessions}`} />
        <Pill label="单节" value={`¥${formatMoney(item.unit_price)}`} />
      </div>
      <UsageMini usage={usage} />
      <Button asChild variant="secondary" className="w-full">
        <Link href={`/classes?memberId=${item.member_id}&packageId=${item.id}&studioId=${item.studio_id ?? ""}&courseType=private`}>用这个课包记一节课</Link>
      </Button>
    </article>
  );
}

function UsageMini({ usage }: { usage: PackageUsage }) {
  const progress = usage.totalSessions > 0 ? Math.min(Math.max((usage.usedSessions / usage.totalSessions) * 100, 0), 100) : 0;
  const tone = getPackageUsageTone(usage);

  return (
    <div className="space-y-2 rounded-3xl bg-secondary/70 p-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">已上 {usage.usedSessions} 节</span>
        <span className={tone === "error" ? "font-medium text-destructive" : "font-medium text-primary"}>{getPackageUsageLabel(usage)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-card/80">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof ShoppingBag; title: string }) {
  return <h2 className="flex items-center gap-2 text-base font-semibold"><Icon className="size-4 text-primary" />{title}</h2>;
}

function Pill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-secondary p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="font-semibold">{value}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}
