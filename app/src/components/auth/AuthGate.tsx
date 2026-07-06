"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/session";
import { isPublicAppPath } from "@/lib/routing/public-paths";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
    setReady(true);
  }, [pathname, router]);

  if (!ready) return null;
  return <>{children}</>;
}
