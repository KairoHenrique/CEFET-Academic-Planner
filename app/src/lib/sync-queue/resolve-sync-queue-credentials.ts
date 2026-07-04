import { ApiError } from "@/lib/api/errors";
import { loadSigaaCredentials } from "@/lib/crypto/sigaa-credential-store";

export function resolveSyncQueuePassword(input: {
  username: string;
  password?: string;
}): string {
  const username = input.username.trim();
  const inline = input.password?.trim();

  if (inline) {
    return inline;
  }

  const stored = loadSigaaCredentials();
  if (stored && stored.username === username) {
    return stored.password;
  }

  throw new ApiError(
    "VALIDATION_ERROR",
    "Informe a senha do SIGAA ou salve a senha no dispositivo.",
    400
  );
}
