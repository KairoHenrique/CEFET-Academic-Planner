import type { Metadata } from "next";
import {
  LegalDocumentView,
  legalTermsMeta,
} from "@/components/legal/LegalDocumentView";
import { TERMS_SECTIONS } from "@/lib/legal/content/terms-sections";
import { LEGAL_ROUTES } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso do ACME HUB — planejador acadêmico CEFET-MG.",
};

export default function TermosPage() {
  const meta = legalTermsMeta();

  return (
    <div className="legal-page-wrap">
      <LegalDocumentView
        title="Termos de Uso"
        version={meta.version}
        updatedLabel={meta.updatedLabel}
        sections={TERMS_SECTIONS}
        alternateHref={LEGAL_ROUTES.privacy}
        alternateLabel="Política de Privacidade"
      />
    </div>
  );
}
