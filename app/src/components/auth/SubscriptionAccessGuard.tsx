"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPerfil } from "@/lib/api/client";
import { isAuthenticated, isCloudSession } from "@/lib/auth/session";
import {
  resolveSubscriptionGuardHref,
  shouldGuardSubscriptionAccess,
} from "@/lib/billing/subscription-access-client";
import { PERFIL_QUERY_KEY } from "@/hooks/usePerfil";

interface SubscriptionAccessGuardProps {
  children: React.ReactNode;
}

export function SubscriptionAccessGuard({
  children,
}: SubscriptionAccessGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const authed = isAuthenticated();
  const cloud = isCloudSession();
  const guardEnabled = authed && cloud;
  const { data: perfil, isLoading, isError } = useQuery({
    queryKey: PERFIL_QUERY_KEY,
    queryFn: getPerfil,
    enabled: guardEnabled,
    staleTime: 30_000,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!guardEnabled) {
      setReady(true);
      return;
    }

    if (isLoading) {
      setReady(false);
      return;
    }

    if (isError || !perfil?.subscription.status) {
      setReady(true);
      return;
    }

    const status = perfil.subscription.status;
    if (shouldGuardSubscriptionAccess(status, pathname)) {
      router.replace(resolveSubscriptionGuardHref(status));
      setReady(false);
      return;
    }

    setReady(true);
  }, [guardEnabled, isError, isLoading, pathname, perfil, router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
