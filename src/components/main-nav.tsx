import Link from "next/link";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/classes", label: "记课" },
  { href: "/performances", label: "业绩" },
  { href: "/salary-calculator", label: "工资" },
  { href: "/mine", label: "我的" },
  { href: "/studios", label: "瑜伽馆" },
  { href: "/members", label: "会员" },
  { href: "/packages", label: "课包" },
  { href: "/salary-rules", label: "工资规则" }
];

export function MainNav() {
  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="主导航">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors",
            "hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
