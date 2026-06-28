import { validationError } from "@/lib/api/errors";
import { loadSigaaCredentials } from "@/lib/crypto/sigaa-credential-store";
import type { SyncRequest } from "@/lib/types/sync";

export interface ResolvedSyncCredentials extends SyncRequest {
  savePassword: boolean;
}

export function resolveSyncCredentials(input: {
  username: string;
  password?: string;
  savePassword?: boolean;
}): ResolvedSyncCredentials {
  const username = input.username.trim();
  const savePassword = input.savePassword === true;

  if (input.password && input.password.length > 0) {
    return {
      username,
      password: input.password,
      savePassword,
    };
  }

  const stored = loadSigaaCredentials();
  if (stored && stored.username === username) {
    return {
      username: stored.username,
      password: stored.password,
      savePassword: true,
    };
  }

  throw validationError("Informe a senha do SIGAA.");
}
