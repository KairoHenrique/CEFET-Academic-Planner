import { getConfig, setConfig } from "@/lib/db/queries";
import type { PerfilAccount } from "@/lib/types/perfil-api";
import { getSyncedUsername } from "@/lib/sync/sync-preferences";

const CONFIG_ACCOUNT_EMAIL = "account.email";
const CONFIG_ACCOUNT_PHONE = "account.phone";
const CONFIG_TRIAL_STARTED_AT = "account.trial_started_at";
const CONFIG_CREDENTIAL_USERNAME = "sigaa.username";

export function getAccountEmail(): string | null {
  const value = getConfig(CONFIG_ACCOUNT_EMAIL);
  return value?.trim() ? value.trim() : null;
}

export function getAccountPhone(): string | null {
  const value = getConfig(CONFIG_ACCOUNT_PHONE);
  return value?.trim() ? value.trim() : null;
}

export function ensureTrialStartedAt(iso = new Date().toISOString()): string {
  const existing = getConfig(CONFIG_TRIAL_STARTED_AT);
  if (existing?.trim()) return existing.trim();
  setConfig(CONFIG_TRIAL_STARTED_AT, iso);
  return iso;
}

export function buildPerfilAccount(): PerfilAccount {
  const cpf =
    getSyncedUsername() ?? getConfig(CONFIG_CREDENTIAL_USERNAME)?.trim() ?? null;

  return {
    cpf,
    email: getAccountEmail(),
    phone: getAccountPhone(),
  };
}
