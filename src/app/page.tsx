import { BookOpenCheck, Building2, Dumbbell, ReceiptText, Settings2, UserRound, WalletCards } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockMonthlySalaryOverview } from "@/lib/mock-overview";
import { formatMoney } from "@/lib/salary/formatMoney";

const quickActions = [
  { href: "/classes", label: "记一节课", icon: BookOpenCheck },
  { href: "/performances", label: "记一笔业绩", icon: WalletCards },
  { href: "/salary-calculator", label: "查看本月工资", icon: ReceiptText }
];

const commonActions = [
  { href: "/members", label: "会员", icon: UserRound },
  { href: "/packages", label: "课包", icon: Dumbbell },
  { href: "/salary-rules", label: "工资规则", icon: Settings2 },
  { href: "/studios", label: "瑜伽馆", icon: Building2 }
];

export default function HomePage() {
  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">今天也稳稳记一笔</p>
        <h1 className="text-3xl font-semibold tracking-normal">瑜伽工资助手</h1>
      </section>

      <section className="grid gap-3">
        {quickActions.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-14 items-center justify-between rounded-lg border bg-card px-4 text-sm font-medium shadow-sm transition-colors hover:bg-secondary"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <item.icon className="size-5" aria-hidden="true" />
              </span>
              {item.label}
            </span>
            <span className="text-muted-foreground">进入</span>
          </Link>
        ))}
      </section>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg">本月概览</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3 p-4 pt-0">
          <div className="rounded-md bg-secondary p-3">
            <div className="text-xs text-muted-foreground">课程数</div>
            <div className="mt-1 text-xl font-semibold">{mockMonthlySalaryOverview.breakdown.classFees.length}</div>
          </div>
          <div className="rounded-md bg-secondary p-3">
            <div className="text-xs text-muted-foreground">本月业绩</div>
            <div className="mt-1 text-xl font-semibold">{formatMoney(mockMonthlySalaryOverview.performanceTotal)}</div>
          </div>
          <div className="rounded-md bg-secondary p-3">
            <div className="text-xs text-muted-foreground">预计工资</div>
            <div className="mt-1 text-xl font-semibold">{formatMoney(mockMonthlySalaryOverview.salaryTotal)}</div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">常用功能</h2>
        <div className="grid grid-cols-2 gap-3">
          {commonActions.map((item) => (
            <Link key={item.href} href={item.href} className="flex min-h-20 flex-col justify-between rounded-lg border bg-card p-4 shadow-sm">
              <item.icon className="size-5 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
