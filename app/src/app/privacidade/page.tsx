import type { Metadata } from "next";
import {
  LegalDocumentView,
  legalPrivacyMeta,
} from "@/components/legal/LegalDocumentView";
import { PRIVACY_SECTIONS } from "@/lib/legal/content/privacy-sections";
import { LEGAL_ROUTES } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade e tratamento de dados pessoais (LGPD) do ACME HUB.",
};

export default function PrivacidadePage() {
  const meta = legalPrivacyMeta();

  return (
    <div className="legal-page-wrap">
      <LegalDocumentView
        title="Política de Privacidade"
        version={meta.version}
        updatedLabel={meta.updatedLabel}
        sections={PRIVACY_SECTIONS}
        alternateHref={LEGAL_ROUTES.terms}
        alternateLabel="Termos de Uso"
      />
    </div>
  );
}
