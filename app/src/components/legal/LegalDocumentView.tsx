import Link from "next/link";
import type { LegalSection } from "@/lib/legal/content/terms-sections";
import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
  resolveLegalContactEmail,
} from "@/lib/legal/constants";

interface LegalDocumentViewProps {
  title: string;
  version: string;
  updatedLabel: string;
  sections: LegalSection[];
  alternateHref: string;
  alternateLabel: string;
}

export function LegalDocumentView({
  title,
  version,
  updatedLabel,
  sections,
  alternateHref,
  alternateLabel,
}: LegalDocumentViewProps) {
  const contactEmail = resolveLegalContactEmail();

  return (
    <article className="legal-page card">
      <header className="legal-page-head">
        <p className="legal-page-kicker">Documento legal</p>
        <h1 className="legal-page-title">{title}</h1>
        <p className="legal-page-meta">
          Versão {version} · {updatedLabel}
        </p>
      </header>

      <div className="legal-page-body">
        {sections.map((section) => (
          <section key={section.id} className="legal-section" id={section.id}>
            <h2 className="legal-section-title">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="legal-section-text">
                {paragraph}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul className="legal-section-list">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <footer className="legal-page-foot">
        <p className="legal-page-contact">
          Dúvidas ou solicitações LGPD:{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
        <p className="legal-page-alt">
          <Link href={alternateHref}>{alternateLabel}</Link>
          {" · "}
          <Link href="/login">Voltar ao login</Link>
        </p>
      </footer>
    </article>
  );
}

export function legalTermsMeta() {
  return {
    version: LEGAL_TERMS_VERSION,
    updatedLabel: "atualizado em 1º de julho de 2026",
  };
}

export function legalPrivacyMeta() {
  return {
    version: LEGAL_PRIVACY_VERSION,
    updatedLabel: "atualizado em 1º de julho de 2026",
  };
}
