"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, BookOpenCheck, CreditCard, ReceiptText, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculatePackageUsageFromClasses, getMemberDetail, listClassesByMember, listPackages, listPerformancesByMember, type PackageUsage } from "@/lib/data";
import { mockClasses, mockMembers, mockPackages, mockPerformances } from "@/lib/mock-data";
import { getPackageUsageLabel, getPackageUsageTone } from "@/lib/packages/usageDisplay";
import { formatMoney } from "@/lib/salary/formatMoney";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ClassRecord, Member, MemberPackage, Performance } from "@/types";

const courseTypeLabels: Record<string, string> = { group: "团课", private: "私教", trial: "体验课", substitute: "代课", other: "其他" };
const performanceTypeLabels: Record<string, string> = { new_card: "新办卡", renewal: "续费", private_package: "私教包", product: "商品", other: "其他" };

export function MemberDetailView({ memberId }: { memberId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(mockMembers.find((item) => item.id === memberId) ?? null);
  const [packages, setPackages] = useState<MemberPackage[]>(mockPackages.filter((item) => item.member_id === memberId));
  const [classes, setClasses] = useState<ClassRecord[]>(mockClasses.filter((item) => item.member_id === memberId));
  const [performances, setPerformances] = useState<Performance[]>(mockPerformances.filter((item) => item.member_id === memberId));
  const [message, setMessage] = useState("");

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
      const [realMember, allPackages, realClasses, realPerformances] = await Promise.all([
        getMemberDetail(supabase, currentUser.id, memberId),
        listPackages(supabase, currentUser.id),
        listClassesByMember(supabase, currentUser.id, memberId),
        listPerformancesByMember(supabase, currentUser.id, memberId)
      ]);
      setMember(realMember);
      setPackages(allPackages.filter((item) => item.member_id === memberId));
      setClasses(realClasses);
      setPerformances(realPerformances);
    }).catch(() => setMessage("网络好像开小差了，请再试一次～"));
  }, [memberId]);

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
            <p className="mt-2 text-sm text-muted-foreground">{member.phone || "未填写手机号"}</p>
          </div>
          {member.note ? <p className="rounded-3xl bg-card/70 p-3 text-sm text-muted-foreground">{member.note}</p> : null}
          {message ? <p className="rounded-3xl bg-card/70 p-3 text-sm text-muted-foreground">{message}</p> : null}
          <div className="grid grid-cols-3 gap-2">
            <Button asChild size="sm"><Link href={`/packages?memberId=${member.id}`}>添加课包</Link></Button>
            <Button asChild size="sm" variant="secondary"><Link href={`/classes?memberId=${member.id}&courseType=private`}>记录私教课</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href={`/performances?memberId=${member.id}`}>记录业绩</Link></Button>
          </div>
        </CardContent>
      </Card>

      <SectionTitle icon={ShoppingBag} title="她的课包" />
      {packages.length === 0 ? <Empty text="还没有课包，可以先给她添加一个～" /> : packages.map((item) => <PackageRow key={item.id} item={item} usage={calculatePackageUsageFromClasses(item, classes)} />)}

      <SectionTitle icon={BookOpenCheck} title="最近课程" />
      {classes.length === 0 ? <Empty text="还没有课程记录。" /> : classes.slice(0, 6).map((item) => (
        <article key={item.id} className="rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm text-muted-foreground">{item.date}</p><h3 className="mt-1 font-medium">{item.course_name}</h3></div>
            <Badge>{courseTypeLabels[item.course_type]}</Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{item.hours} 课时 · {item.student_count} 人</p>
        </article>
      ))}

      <SectionTitle icon={ReceiptText} title="相关业绩" />
      {performances.length === 0 ? <Empty text="还没有相关业绩记录。" /> : performances.slice(0, 6).map((item) => (
        <article key={item.id} className="rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm text-muted-foreground">{item.date}</p><h3 className="mt-1 font-medium">{performanceTypeLabels[item.type]}</h3></div>
            <div className="font-semibold text-primary">¥{formatMoney(item.amount)}</div>
          </div>
          {!item.commissionable ? <p className="mt-3 rounded-2xl bg-secondary/70 px-3 py-2 text-sm text-muted-foreground">不计提成</p> : null}
        </article>
      ))}
    </div>
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
        <Link href={`/classes?memberId=${item.member_id}&packageId=${item.id}&teacherId=${item.teacher_id ?? ""}&courseType=private`}>用这个课包记一节课</Link>
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

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}
