import { validationError } from "@/lib/api/errors";
import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
} from "@/lib/legal/constants";

export interface LegalConsentInput {
  termsVersion: string;
  privacyVersion: string;
}

function readBooleanField(value: unknown): boolean {
  return value === true;
}

export function parseLegalConsent(body: Record<string, unknown>): LegalConsentInput {
  const acceptedLegal = body.acceptedLegal;

  if (!acceptedLegal || typeof acceptedLegal !== "object") {
    throw validationError(
      "É necessário aceitar os Termos de Uso e a Política de Privacidade."
    );
  }

  const payload = acceptedLegal as Record<string, unknown>;

  if (!readBooleanField(payload.terms) || !readBooleanField(payload.privacy)) {
    throw validationError(
      "É necessário aceitar os Termos de Uso e a Política de Privacidade."
    );
  }

  const termsVersion =
    typeof payload.termsVersion === "string" ? payload.termsVersion.trim() : "";
  const privacyVersion =
    typeof payload.privacyVersion === "string"
      ? payload.privacyVersion.trim()
      : "";

  if (termsVersion !== LEGAL_TERMS_VERSION) {
    throw validationError(
      "Versão dos Termos de Uso desatualizada. Recarregue a página e tente novamente."
    );
  }

  if (privacyVersion !== LEGAL_PRIVACY_VERSION) {
    throw validationError(
      "Versão da Política de Privacidade desatualizada. Recarregue a página e tente novamente."
    );
  }

  return { termsVersion, privacyVersion };
}
