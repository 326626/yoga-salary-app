"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, BookOpenCheck, CreditCard, PenLine, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { calculatePackageUsageFromClasses, countPackageRelations, deleteMemberPackage, getPackageDetail, listClassesByPackage, listMembers, listTeachers, type PackageUsage } from "@/lib/data";
import { mockClasses, mockMembers, mockPackages, mockTeachers } from "@/lib/mock-data";
import { getPackageFinishedMessage, getPackageUsageLabel, getPackageUsageTone } from "@/lib/packages/usageDisplay";
import { getPackageDeletePrompt } from "@/lib/relationPrompts";
import { formatMoney } from "@/lib/salary/formatMoney";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ClassRecord, Member, MemberPackage, Teacher } from "@/types";

const courseTypeLabels: Record<string, string> = { group: "团课", private: "私教", trial: "体验课", substitute: "代课", other: "其他" };

export function PackageDetailView({ packageId }: { packageId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [item, setItem] = useState<MemberPackage | null>(mockPackages.find((record) => record.id === packageId) ?? null);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [classes, setClasses] = useState<ClassRecord[]>(mockClasses.filter((record) => record.package_id === packageId));
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setMessage("当前是体验数据，登录后可以查看你自己的课包详情。");
        return;
      }
      const [realPackage, realMembers, realTeachers, realClasses] = await Promise.all([
        getPackageDetail(supabase, currentUser.id, packageId),
        listMembers(supabase, currentUser.id),
        listTeachers(supabase, currentUser.id),
        listClassesByPackage(supabase, currentUser.id, packageId)
      ]);
      setItem(realPackage);
      setMembers(realMembers);
      setTeachers(realTeachers);
      setClasses(realClasses);
    }).catch(() => setMessage("网络好像开小差了，请再试一次～"));
  }, [packageId]);

  async function removePackage() {
    if (!user || !item || !isSupabaseConfigured()) {
      setMessage("登录后可以删除课包～");
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      const counts = await countPackageRelations(supabase, user.id, item.id);
      if (!window.confirm(getPackageDeletePrompt(counts))) return;
      await deleteMemberPackage(supabase, user.id, item.id);
      setMessage("课包已删除～");
      setItem(null);
    } catch {
      setMessage("暂时不能删除，因为还有关联记录。可以先保留这个课包～");
    }
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" className="px-0"><Link href="/packages"><ArrowLeft className="mr-2 size-4" />返回课包</Link></Button>
        <Card><CardContent className="p-5 text-sm text-muted-foreground">{message || "没有找到这个课包，可能已经删除或不属于当前账号。"}</CardContent></Card>
      </div>
    );
  }

  const member = members.find((record) => record.id === item.member_id);
  const teacher = teachers.find((record) => record.id === item.teacher_id);
  const usage = calculatePackageUsageFromClasses(item, classes);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" className="px-0"><Link href="/packages"><ArrowLeft className="mr-2 size-4" />返回课包</Link></Button>

      <Card className="bg-gradient-to-br from-secondary via-card to-accent">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{member?.name ?? "会员"}</p>
              <h1 className="mt-2 text-2xl font-semibold">{item.package_name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{courseTypeLabels[item.course_type]} · {item.purchase_date}</p>
            </div>
            <CreditCard className="size-6 text-primary" />
          </div>
          {message ? <p className="rounded-3xl bg-card/70 p-3 text-sm text-muted-foreground">{message}</p> : null}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <Pill label="成交价" value={`¥${formatMoney(item.total_amount)}`} />
            <Pill label="总课时" value={`${item.total_sessions}`} />
            <Pill label="单节" value={`¥${formatMoney(item.unit_price)}`} strong />
          </div>
          {teacher ? <Badge>{teacher.name}</Badge> : null}
          {item.note ? <p className="rounded-3xl bg-card/70 p-3 text-sm text-muted-foreground">{item.note}</p> : null}
          <Button asChild className="w-full">
            <Link href={`/classes?memberId=${item.member_id}&packageId=${item.id}&teacherId=${item.teacher_id ?? ""}&courseType=private`}>用这个课包记一节课</Link>
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="secondary"><Link href={`/packages?memberId=${item.member_id}&editPackageId=${item.id}`}><PenLine className="mr-2 size-4" />编辑课包</Link></Button>
            <Button type="button" variant="outline" onClick={removePackage}><Trash2 className="mr-2 size-4" />删除课包</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-base font-semibold">课包进度</h2>
          <UsageProgress usage={usage} />
          <p className={usage.remainingSessions < 0 ? "rounded-3xl bg-amber-50 p-3 text-sm text-amber-800" : "rounded-3xl bg-secondary/70 p-3 text-sm text-muted-foreground"}>
            {getPackageFinishedMessage(usage)}
          </p>
        </CardContent>
      </Card>

      <h2 className="flex items-center gap-2 text-base font-semibold"><BookOpenCheck className="size-4 text-primary" />最近消课</h2>
      {classes.length === 0 ? <Empty text="还没有用这个课包记录课程。" /> : classes.slice(0, 8).map((record) => (
        <article key={record.id} className="rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm text-muted-foreground">{record.date}</p><h3 className="mt-1 font-medium">{record.course_name}</h3></div>
            <Badge>{courseTypeLabels[record.course_type]}</Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{record.hours} 课时 · {record.student_count} 人</p>
        </article>
      ))}
    </div>
  );
}

function Pill({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="rounded-2xl bg-card/70 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className={strong ? "font-semibold text-primary" : "font-semibold"}>{value}</div></div>;
}

function UsageProgress({ usage }: { usage: PackageUsage }) {
  const progress = usage.totalSessions > 0 ? Math.min(Math.max((usage.usedSessions / usage.totalSessions) * 100, 0), 100) : 0;
  const tone = getPackageUsageTone(usage);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Pill label="总课时" value={`${usage.totalSessions}`} />
        <Pill label="已上" value={`${usage.usedSessions}`} />
        <Pill label="剩余" value={getPackageUsageLabel(usage)} strong />
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${progress}%` }} />
      </div>
      {tone === "warning" ? <p className="text-sm text-amber-700">这个课包已经上完啦～</p> : null}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}
