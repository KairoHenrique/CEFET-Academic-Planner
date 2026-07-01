import Link from "next/link";
import type { PerfilResponse } from "@/lib/types/perfil-api";
import {
  formatCpf,
  formatDateTime,
  formatPhone,
  formatRemainingDays,
} from "@/lib/perfil/format-profile-value";

interface ProfileInfoRowProps {
  label: string;
  value: string;
  hint?: string;
}

function ProfileInfoRow({ label, value, hint }: ProfileInfoRowProps) {
  return (
    <div className="profile-info-row">
      <dt className="profile-info-label">{label}</dt>
      <dd className="profile-info-value">{value}</dd>
      {hint ? <dd className="profile-info-hint">{hint}</dd> : null}
    </div>
  );
}

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
  onStartTutorial: () => void;
}

export function ProfileModalBody({ data, onStartTutorial }: ProfileModalBodyProps) {
  const { profile, account, subscription, sync } = data;

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

      <section className="profile-modal-section" aria-labelledby="profile-dados-title">
        <h3 id="profile-dados-title" className="profile-modal-section-title">
          Dados da conta
        </h3>
        <dl className="profile-info-list">
          <ProfileInfoRow
            label="Matrícula"
            value={profile?.matricula ?? "—"}
          />
          <ProfileInfoRow label="CPF" value={formatCpf(account.cpf)} />
          <ProfileInfoRow
            label="E-mail da conta"
            value={account.email ?? "Não informado"}
          />
          <ProfileInfoRow
            label="Celular"
            value={formatPhone(account.phone)}
          />
          <ProfileInfoRow label="Curso" value={profile?.curso ?? "—"} />
          <ProfileInfoRow
            label="Último sync"
            value={formatDateTime(sync.lastSyncAt)}
            hint={`Sync automático a cada ${sync.intervalMinutes} min.`}
          />
        </dl>
      </section>

      <section
        className="profile-modal-section"
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

      <section className="profile-modal-section profile-modal-actions">
        <button
          type="button"
          className="btn-outline profile-tutorial-btn"
          onClick={onStartTutorial}
        >
          Tutorial do site
        </button>
        <p className="profile-modal-footer-hint">
          Passe por cada área do app com legendas explicando o que cada parte faz.
        </p>
      </section>
    </div>
  );
}
