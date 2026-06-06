import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Leaf } from "lucide-react";

import { BottomTabNav } from "@/components/bottom-tab-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "瑜伽工资助手",
  description: "服务于瑜伽老师和瑜伽馆的工资记录 App",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "瑜伽工资"
  }
};

export const viewport: Viewport = {
  themeColor: "#f8f5ee"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen">
          <div className="mx-auto min-h-screen max-w-md bg-background/85 shadow-[0_20px_80px_rgba(70,55,42,0.12)] backdrop-blur md:border-x md:border-white/70">
            <header className="sticky top-0 z-40 border-b border-white/70 bg-card/85 backdrop-blur-xl">
              <div className="flex min-h-14 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Leaf className="size-4" aria-hidden="true" />
                  </span>
                  <span>瑜伽工资助手</span>
                </Link>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">轻量原型</span>
              </div>
            </header>
            <main className="px-4 pb-24 pt-5">{children}</main>
            <BottomTabNav />
          </div>
        </div>
      </body>
    </html>
  );
}
