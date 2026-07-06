import Link from "next/link";
import { LEGAL_ROUTES } from "@/lib/legal/constants";

interface LegalFooterLinksProps {
  className?: string;
}

export function LegalFooterLinks({ className = "" }: LegalFooterLinksProps) {
  return (
    <nav
      className={`legal-footer-links ${className}`.trim()}
      aria-label="Documentos legais"
    >
      <Link className="login-foot-link" href={LEGAL_ROUTES.terms}>
        Termos de Uso
      </Link>
      <span className="legal-footer-sep" aria-hidden="true">
        ·
      </span>
      <Link className="login-foot-link" href={LEGAL_ROUTES.privacy}>
        Política de Privacidade
      </Link>
    </nav>
  );
}
