import { ApiError } from "@/lib/api/errors";

let activeSync: Promise<unknown> | null = null;

/** Evita dois Playwrights SIGAA ao mesmo tempo (trava UI e duplica tempo). */
export async function withSyncLock<T>(operation: () => Promise<T>): Promise<T> {
  if (activeSync) {
    throw new ApiError(
      "RATE_LIMITED",
      "Sincronização já em andamento. Aguarde a conclusão.",
      409
    );
  }

  const current = operation().finally(() => {
    if (activeSync === current) {
      activeSync = null;
    }
  });

  activeSync = current;
  return current;
}
