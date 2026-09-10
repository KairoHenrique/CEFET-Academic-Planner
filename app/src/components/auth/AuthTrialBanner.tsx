import { Icon } from "@/components/ui/Icon";

/** App gratuito — sem trial/assinatura. */
export function AuthTrialBanner() {
  return (
    <div className="auth-trial-banner" role="note">
      <span className="auth-trial-banner-icon" aria-hidden>
        <Icon name="star" size={15} />
      </span>
      <div className="auth-trial-banner-copy">
        <span className="auth-trial-banner-eyebrow">100% gratuito</span>
        <span className="auth-trial-banner-title">
          Sem assinatura — acesso completo ao criar a conta
        </span>
      </div>
    </div>
  );
}
