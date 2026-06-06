"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, Calculator, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStudioDetail, listClasses, listMembers, listPackages, listPerformances, listSalaryRules } from "@/lib/data";
import { mockClasses, mockMembers, mockPackages, mockPerformances, mockSalaryRules, mockStudios } from "@/lib/mock-data";
import { formatMoney } from "@/lib/salary/formatMoney";
import { calculateStudioMonthOverview } from "@/lib/studios/studioOverview";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ClassRecord, Member, MemberPackage, Performance, SalaryRule, Studio } from "@/types";

const month = new Date().toISOString().slice(0, 7);
const courseTypeLabels: Record<string, string> = { group: "团课", private: "私教", trial: "体验课", substitute: "代课", other: "其他" };
const performanceTypeLabels: Record<string, string> = { new_card: "新办卡", renewal: "续费", private_package: "私教包", product: "商品", other: "其他" };

export function StudioDetailView({ studioId }: { studioId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [studio, setStudio] = useState<Studio | null>(mockStudios.find((item) => item.id === studioId) ?? null);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [classes, setClasses] = useState<ClassRecord[]>(mockClasses);
  const [performances, setPerformances] = useState<Performance[]>(mockPerformances);
  const [packages, setPackages] = useState<MemberPackage[]>(mockPackages);
  const [salaryRules, setSalaryRules] = useState<SalaryRule[]>(mockSalaryRules);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setMessage("当前是体验数据，登录后可以查看你自己的瑜伽馆详情。");
        return;
      }
      const [realStudio, realMembers, realClasses, realPerformances, realPackages, realRules] = await Promise.all([
        getStudioDetail(supabase, currentUser.id, studioId),
        listMembers(supabase, currentUser.id),
        listClasses(supabase, currentUser.id),
        listPerformances(supabase, currentUser.id),
        listPackages(supabase, currentUser.id),
        listSalaryRules(supabase, currentUser.id)
      ]);
      setStudio(realStudio);
      setMembers(realMembers);
      setClasses(realClasses);
      setPerformances(realPerformances);
      setPackages(realPackages);
      setSalaryRules(realRules);
    }).catch(() => setMessage("网络好像开小差了，请再试一次～"));
  }, [studioId]);

  const related = useMemo(() => ({
    classes: classes.filter((item) => item.studio_id === studioId),
    performances: performances.filter((item) => item.studio_id === studioId),
    packages: packages.filter((item) => item.studio_id === studioId),
    rules: salaryRules.filter((item) => item.studio_id === studioId || !item.studio_id)
  }), [classes, packages, performances, salaryRules, studioId]);

  const overview = useMemo(() => calculateStudioMonthOverview({ classes, performances, packages, salaryRules, studioId, month }), [classes, packages, performances, salaryRules, studioId]);

  if (!studio) {
    return <div className="space-y-4"><BackButton /><Card><CardContent className="p-5 text-sm text-muted-foreground">没有找到这个瑜伽馆，可能已经删除或不属于当前账号。</CardContent></Card></div>;
  }

  return (
    <div className="space-y-5">
      <BackButton />
      <Card className="bg-gradient-to-br from-secondary via-card to-accent">
        <CardContent className="space-y-4 p-5">
          <MapPin className="size-6 text-primary" />
          <div><p className="text-sm text-muted-foreground">瑜伽馆详情</p><h1 className="mt-2 text-2xl font-semibold">{studio.name}</h1></div>
          {message ? <p className="rounded-3xl bg-card/70 p-3 text-sm text-muted-foreground">{message}</p> : null}
          <div className="grid gap-1 text-sm text-muted-foreground">
            {studio.contact_name ? <span>联系人：{studio.contact_name}</span> : null}
            {studio.phone ? <span>电话：{studio.phone}</span> : null}
            {studio.address ? <span>地址：{studio.address}</span> : null}
            {studio.note ? <span>{studio.note}</span> : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild size="sm"><Link href={`/classes?studioId=${studio.id}`}>记一节课</Link></Button>
            <Button asChild size="sm" variant="secondary"><Link href={`/performances?studioId=${studio.id}`}>记一笔业绩</Link></Button>
            <Button asChild size="sm" variant="secondary"><Link href={`/packages?studioId=${studio.id}`}>添加课包</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href={`/salary-rules?studioId=${studio.id}`}>设置工资规则</Link></Button>
          </div>
          <Button asChild className="w-full"><Link href={`/salary-calculator?studioId=${studio.id}`}><Calculator className="mr-2 size-4" />计算这个瑜伽馆工资</Link></Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">本月概览</h2>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="课程" value={`${overview.classCount}`} />
          <Stat label="业绩" value={`¥${formatMoney(overview.performanceTotal)}`} />
          <Stat label="规则" value={overview.ruleLabel.includes("专属") ? "专属" : overview.ruleLabel.includes("通用") ? "通用" : "未设置"} />
        </div>
        <div className="rounded-3xl bg-secondary/70 p-4 text-sm text-muted-foreground">{overview.ruleLabel}</div>
      </section>

      <ListSection title="最近课程">{related.classes.slice(0, 6).map((item) => <article key={item.id} className="rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm"><div className="flex justify-between gap-3"><div><p className="text-sm text-muted-foreground">{item.date}</p><h3 className="font-medium">{item.course_name}</h3></div><Badge>{courseTypeLabels[item.course_type]}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{item.hours} 课时 · {members.find((member) => member.id === item.member_id)?.name ?? "未关联会员"}</p></article>)}</ListSection>
      <ListSection title="最近业绩">{related.performances.slice(0, 6).map((item) => <article key={item.id} className="rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm"><div className="flex justify-between gap-3"><div><p className="text-sm text-muted-foreground">{item.date}</p><h3 className="font-medium">{performanceTypeLabels[item.type]}</h3></div><div className="font-semibold text-primary">¥{formatMoney(item.amount)}</div></div></article>)}</ListSection>
      <ListSection title="相关课包">{related.packages.slice(0, 6).map((item) => <article key={item.id} className="rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm"><p className="text-sm text-muted-foreground">{members.find((member) => member.id === item.member_id)?.name ?? "会员"}</p><Link href={`/packages/${item.id}`} className="font-medium text-foreground">{item.package_name}</Link><p className="mt-2 text-sm text-muted-foreground">¥{formatMoney(item.total_amount)} · {item.total_sessions} 节 · ¥{formatMoney(item.unit_price)}/节</p></article>)}</ListSection>
      <ListSection title="当前工资规则">{related.rules.filter((item) => item.active).slice(0, 3).map((item) => <article key={item.id} className="rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm"><div className="flex justify-between gap-3"><h3 className="font-medium">{item.name}</h3><Badge>{item.studio_id ? "专属" : "通用"}</Badge></div></article>)}</ListSection>
    </div>
  );
}

function BackButton() {
  return <Button asChild variant="ghost" className="px-0"><Link href="/studios"><ArrowLeft className="mr-2 size-4" />返回瑜伽馆</Link></Button>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl border border-white/70 bg-card/90 p-3 text-center shadow-sm"><div className="text-lg font-semibold text-primary">{value}</div><div className="mt-1 text-xs text-muted-foreground">{label}</div></div>;
}

function ListSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-3"><h2 className="text-base font-semibold">{title}</h2>{children ? children : <div className="rounded-3xl border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">暂时还没有记录。</div>}</section>;
}
