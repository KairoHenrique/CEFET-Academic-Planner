import { validationError } from "@/lib/api/errors";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { normalizeSigaaUsername } from "@/lib/db/connection-manager";
import { loadSigaaCredentials } from "@/lib/crypto/sigaa-credential-store";
import { loadServerSigaaCredentials } from "@/lib/crypto/server-sigaa-credential-store";

const SERVER_PASSWORD_MESSAGE =
  "Senha SIGAA não encontrada no servidor. Faça login novamente.";

const CLIENT_PASSWORD_MESSAGE =
  "Informe a senha do SIGAA ou salve a senha no dispositivo.";

export async function resolveSigaaPassword(input: {
  username: string;
  password?: string;
}): Promise<string> {
  const inline = input.password?.trim();
  if (inline) {
    return inline;
  }

  const username = normalizeSigaaUsername(input.username);

  if (isPostgresBackend()) {
    const server = await loadServerSigaaCredentials(username);
    if (server?.username === username) {
      return server.password;
    }

    throw validationError(SERVER_PASSWORD_MESSAGE);
  }

  return resolveSigaaPasswordFromLocalStore(username);
}

export function resolveSigaaPasswordSync(input: {
  username: string;
  password?: string;
}): string {
  const inline = input.password?.trim();
  if (inline) {
    return inline;
  }

  if (isPostgresBackend()) {
    throw validationError(SERVER_PASSWORD_MESSAGE);
  }

  const username = normalizeSigaaUsername(input.username);
  return resolveSigaaPasswordFromLocalStore(username);
}

function resolveSigaaPasswordFromLocalStore(username: string): string {
  const stored = loadSigaaCredentials();
  if (stored?.username === username) {
    return stored.password;
  }

  throw validationError(CLIENT_PASSWORD_MESSAGE);
}
