"use client";

import Link from "next/link";
import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_ROUTES,
  LEGAL_TERMS_VERSION,
} from "@/lib/legal/constants";

interface LegalConsentFieldProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function LegalConsentField({
  checked,
  disabled = false,
  onChange,
}: LegalConsentFieldProps) {
  return (
    <label className="legal-consent-field">
      <input
        type="checkbox"
        className="legal-consent-checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="legal-consent-copy">
        Li e aceito os{" "}
        <Link
          href={LEGAL_ROUTES.terms}
          target="_blank"
          rel="noopener noreferrer"
          className="legal-consent-link"
        >
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link
          href={LEGAL_ROUTES.privacy}
          target="_blank"
          rel="noopener noreferrer"
          className="legal-consent-link"
        >
          Política de Privacidade
        </Link>{" "}
        (v. {LEGAL_TERMS_VERSION} / {LEGAL_PRIVACY_VERSION}).
      </span>
    </label>
  );
}

export function buildLegalConsentPayload(accepted: boolean) {
  return {
    terms: accepted,
    privacy: accepted,
    termsVersion: LEGAL_TERMS_VERSION,
    privacyVersion: LEGAL_PRIVACY_VERSION,
  };
}
