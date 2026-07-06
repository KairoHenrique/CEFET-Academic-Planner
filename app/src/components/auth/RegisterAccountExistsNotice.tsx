import Link from "next/link";

export function RegisterAccountExistsNotice() {
  return (
    <div className="auth-account-exists" role="alert">
      <p className="auth-account-exists-title">Este CPF já possui conta</p>
      <p className="auth-account-exists-body">
        O trial gratuito é válido uma vez por CPF. Entre com sua senha do SIGAA para
        escolher ou renovar um plano.
      </p>
      <Link href="/login" className="btn-gold auth-account-exists-link">
        Ir para login
      </Link>
    </div>
  );
}
