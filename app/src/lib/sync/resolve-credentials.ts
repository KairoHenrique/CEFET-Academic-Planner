import { validationError } from "@/lib/api/errors";
import { resolveSigaaPassword, resolveSigaaPasswordSync } from "@/lib/crypto/resolve-sigaa-password";
import type { SyncRequest } from "@/lib/types/sync";

export interface ResolvedSyncCredentials extends SyncRequest {
  savePassword: boolean;
}

export async function resolveSyncCredentials(input: {
  username: string;
  password?: string;
  savePassword?: boolean;
}): Promise<ResolvedSyncCredentials> {
  const username = input.username.trim();
  const savePassword = input.savePassword === true;
  const password = await resolveSigaaPassword({
    username,
    password: input.password,
  });

  return {
    username,
    password,
    savePassword,
  };
}

export function resolveSyncCredentialsSync(input: {
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

  try {
    const password = resolveSigaaPasswordSync({
      username,
      password: input.password,
    });

    return {
      username,
      password,
      savePassword: true,
    };
  } catch (error) {
    throw validationError(
      error instanceof Error ? error.message : "Informe a senha do SIGAA."
    );
  }
}
