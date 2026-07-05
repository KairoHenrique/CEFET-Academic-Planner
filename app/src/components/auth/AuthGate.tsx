"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/session";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onLoginPage = pathname === "/login";
    const onDevPanel = pathname === "/dev" || pathname.startsWith("/dev/");
    const authed = isAuthenticated();

    if (!authed && !onLoginPage && !onDevPanel) {
      router.replace("/login");
      return;
    }
    if (authed && onLoginPage) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) return null;
  return <>{children}</>;
}
