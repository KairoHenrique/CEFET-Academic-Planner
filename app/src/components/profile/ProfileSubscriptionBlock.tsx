"use client";

import { useBillingAccount } from "@/hooks/useBillingAccount";
import { ProfileSubscriptionSection } from "@/components/profile/ProfileSubscriptionSection";
import type { PerfilSubscription } from "@/lib/types/perfil-api";

interface ProfileSubscriptionBlockProps {
  subscription: PerfilSubscription;
}

export function ProfileSubscriptionBlock({
  subscription,
}: ProfileSubscriptionBlockProps) {
  const { data, isLoading } = useBillingAccount();

  return (
    <ProfileSubscriptionSection
      subscription={subscription}
      payments={data?.payments ?? []}
      paymentsLoading={isLoading}
    />
  );
}
