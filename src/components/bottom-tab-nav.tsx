"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, NotebookPen, UserRound, WalletCards } from "lucide-react";

import { cn } from "@/lib/utils";

const tabItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/classes", label: "记课", icon: NotebookPen },
  { href: "/performances", label: "业绩", icon: WalletCards },
  { href: "/salary-calculator", label: "工资", icon: BarChart3 },
  { href: "/mine", label: "我的", icon: UserRound }
];

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-white/70 bg-card/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_36px_rgba(70,55,42,0.10)] backdrop-blur-xl md:border-x" aria-label="底部导航">
      <div className="grid grid-cols-5 gap-1">
        {tabItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
            className={cn(
                "flex min-h-[var(--app-tab-height)] flex-col items-center justify-center gap-1 rounded-2xl text-xs transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "bg-secondary text-primary shadow-sm" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
