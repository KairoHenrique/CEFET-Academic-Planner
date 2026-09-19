"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppRouteLoading } from "@/components/layout/AppRouteLoading";
import { isAuthenticated } from "@/lib/auth/session";
import { isPublicAppPath } from "@/lib/routing/public-paths";

interface AuthGateProps {
  children: React.ReactNode;
}

const AUTH_GATE_TIMEOUT_MS = 8_000;

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const isPublic = isPublicAppPath(pathname);
  // Paginas publicas (ex. /inicio p/ AdSense) nao ficam presas em "Preparando sessao".
  const [ready, setReady] = useState(isPublic);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (!cancelled) {
        setReady(true);
      }
    };

    const onLoginPage = pathname === "/login";
    const publicPath = isPublicAppPath(pathname);
    const authed = isAuthenticated();

    if (!authed && !publicPath) {
      router.replace("/login");
      return;
    }
    if (authed && onLoginPage) {
      router.replace("/");
      return;
    }
    finish();

    const timer = window.setTimeout(finish, AUTH_GATE_TIMEOUT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pathname, router]);

  if (!ready && !isPublic) {
    return <AppRouteLoading message="Preparando sessão…" />;
  }

  return <>{children}</>;
}
