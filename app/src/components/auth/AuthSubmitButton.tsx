import { Icon, type IconName } from "@/components/ui/Icon";

type AuthSubmitVariant = "login" | "register";

interface AuthSubmitButtonProps {
  variant: AuthSubmitVariant;
  loading?: boolean;
  disabled?: boolean;
}

const SUBMIT_COPY: Record<
  AuthSubmitVariant,
  { label: string; loading: string; icon: IconName }
> = {
  login: {
    label: "Entrar",
    loading: "Entrando…",
    icon: "arrow-right",
  },
  register: {
    label: "Abrir minha conta",
    loading: "Criando conta…",
    icon: "graduation",
  },
};

function AuthSubmitIcon({
  icon,
  loading,
}: {
  icon: IconName;
  loading: boolean;
}) {
  return (
    <span className="auth-submit-icon" aria-hidden>
      <Icon
        name={icon}
        size={17}
        className={loading ? "auth-submit-icon-spin" : undefined}
      />
    </span>
  );
}

export function AuthSubmitButton({
  variant,
  loading = false,
  disabled = false,
}: AuthSubmitButtonProps) {
  const copy = SUBMIT_COPY[variant];
  const isDisabled = disabled || loading;
  const label = loading ? copy.loading : copy.label;

  return (
    <button
      type="submit"
      className={`auth-submit auth-submit--${variant}`}
      disabled={isDisabled}
      aria-busy={loading}
    >
      {variant === "register" && (
        <AuthSubmitIcon icon={copy.icon} loading={loading} />
      )}

      <span className="auth-submit-copy">
        <span className="auth-submit-label">{label}</span>
      </span>

      {variant === "login" ? (
        <AuthSubmitIcon icon={copy.icon} loading={loading} />
      ) : (
        !loading && (
          <Icon
            name="chevron-right"
            size={18}
            className="auth-submit-chevron"
            aria-hidden
          />
        )
      )}
    </button>
  );
}
