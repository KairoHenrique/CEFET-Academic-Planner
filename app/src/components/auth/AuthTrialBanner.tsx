import { Icon } from "@/components/ui/Icon";

export function AuthTrialBanner() {
  return (
    <div className="auth-trial-banner" role="note">
      <span className="auth-trial-banner-icon" aria-hidden>
        <Icon name="star" size={15} />
      </span>
      <div className="auth-trial-banner-copy">
        <span className="auth-trial-banner-eyebrow">Trial gratuito</span>
        <span className="auth-trial-banner-title">7 dias de acesso</span>
      </div>
    </div>
  );
}
