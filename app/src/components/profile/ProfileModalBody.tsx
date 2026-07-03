import Link from "next/link";
import type { PerfilResponse } from "@/lib/types/perfil-api";
import { formatDateTime, formatRemainingDays } from "@/lib/perfil/format-profile-value";
import { ProfileAccountSection } from "@/components/profile/ProfileAccountSection";
import { ProfileNotificationSection } from "@/components/profile/ProfileNotificationSection";
import { ProfileSyncFooter } from "@/components/profile/ProfileSyncFooter";

function subscriptionStatusLabel(
  status: PerfilResponse["subscription"]["status"]
): string {
  const labels: Record<PerfilResponse["subscription"]["status"], string> = {
    trial_active: "Trial ativo",
    trial_expired: "Trial expirado",
    pending_payment: "Aguardando pagamento",
    active: "Assinatura ativa",
    expired: "Assinatura expirada",
    cancelled: "Assinatura cancelada",
  };
  return labels[status];
}

interface ProfileModalBodyProps {
  data: PerfilResponse;
  isSaving: boolean;
  saveError: string | null;
  onSaveContact: (input: { email: string; phone: string }) => Promise<void>;
  onToggleNotification: (
    key: keyof PerfilResponse["notifications"],
    enabled: boolean
  ) => void;
}

export function ProfileModalBody({
  data,
  isSaving,
  saveError,
  onSaveContact,
  onToggleNotification,
}: ProfileModalBodyProps) {
  const { profile, account, subscription, sync, notifications } = data;

  return (
    <div className="profile-modal-body">
      <header className="profile-modal-hero">
        <div className="profile-modal-avatar" aria-hidden="true">
          {profile?.initials ?? "??"}
        </div>
        <div>
          <p className="profile-modal-name">{profile?.nome ?? "Aguardando sync"}</p>
          {profile?.status && (
            <p className="profile-modal-status">{profile.status}</p>
          )}
        </div>
      </header>

      {saveError ? (
        <p className="profile-save-error" role="alert">
          {saveError}
        </p>
      ) : null}

      <ProfileAccountSection
        profile={profile}
        account={account}
        isSaving={isSaving}
        onSaveContact={onSaveContact}
      />

      <section
        className="profile-modal-section profile-plan-section"
        aria-labelledby="profile-plano-title"
      >
        <h3 id="profile-plano-title" className="profile-modal-section-title">
          Plano
        </h3>
        <div className="profile-plan-card">
          <div className="profile-plan-card-head">
            <span className="profile-plan-name">{subscription.planLabel}</span>
            <span
              className={`profile-plan-status profile-plan-status--${subscription.status}`}
            >
              {subscriptionStatusLabel(subscription.status)}
            </span>
          </div>
          <p className="profile-plan-remaining">
            {formatRemainingDays(subscription.daysRemaining)}
          </p>
          <p className="profile-plan-expires">
            Válido até{" "}
            {formatDateTime(subscription.expiresAt).split(",")[0] ?? "—"}
          </p>
          <Link href={subscription.renewHref} className="btn-gold btn-sm profile-plan-renew">
            Renovar ou assinar plano
          </Link>
        </div>
      </section>

      <ProfileNotificationSection
        preferences={notifications}
        isSaving={isSaving}
        onToggle={onToggleNotification}
      />

      <ProfileSyncFooter sync={sync} />
    </div>
  );
}
