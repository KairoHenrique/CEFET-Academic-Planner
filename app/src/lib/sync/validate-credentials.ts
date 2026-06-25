import { ApiError } from "@/lib/api/errors";
import type { SyncRequest } from "@/lib/types/sync";

export function assertSyncCredentialsAllowed(
  credentials: SyncRequest
): void {
  if (credentials.password === "erro") {
    throw new ApiError(
      "INVALID_CREDENTIALS",
      "Usuário ou senha inválidos. Verifique suas credenciais do SIGAA.",
      401
    );
  }

  if (credentials.username.toLowerCase() === "offline") {
    throw new ApiError(
      "SIGAA_OFFLINE",
      "SIGAA indisponível no momento. Tente novamente mais tarde.",
      503
    );
  }
}
