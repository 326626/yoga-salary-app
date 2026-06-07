"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buildLoginRedirect, isProtectedRoute } from "@/lib/auth/protectedRoutes";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [allowed, setAllowed] = useState(() => !isProtectedRoute(pathname));

  useEffect(() => {
    let cancelled = false;
    const protectedRoute = isProtectedRoute(pathname);
    if (!protectedRoute) {
      setAllowed(true);
      return;
    }
    setAllowed(false);
    if (!isSupabaseConfigured()) {
      router.replace(buildLoginRedirect(pathname, searchParams.toString() ? `?${searchParams.toString()}` : ""));
      return;
    }
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession()
      .then(({ data }) => {
        if (cancelled) return;
        if (data.session?.user) {
          setAllowed(true);
        } else {
          router.replace(buildLoginRedirect(pathname, searchParams.toString() ? `?${searchParams.toString()}` : ""));
        }
      })
      .catch(() => {
        if (!cancelled) router.replace(buildLoginRedirect(pathname, searchParams.toString() ? `?${searchParams.toString()}` : ""));
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router, searchParams]);

  if (!allowed) {
    return <div className="rounded-3xl bg-card/80 p-5 text-sm text-muted-foreground">正在加载你的记录～</div>;
  }

  return <>{children}</>;
}
