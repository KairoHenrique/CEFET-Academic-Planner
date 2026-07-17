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
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (!cancelled) {
        setReady(true);
      }
    };

    const onLoginPage = pathname === "/login";
    const isPublic = isPublicAppPath(pathname);
    const authed = isAuthenticated();

    if (!authed && !isPublic) {
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

  if (!ready) {
    return <AppRouteLoading message="Preparando sessão…" />;
  }

  return <>{children}</>;
}
