import { ApiClientError } from "@/lib/api/client";
import type { SyncStep } from "@/lib/types/sync";

/**
 * Web sem worker PC: scrape monólito no edge estoura CPU (Error 1102).
 * Preferir Servidor ACME no ar ou app Android (HTTP nativo).
 */
export async function runServerDeviceRunClient(options: {
  password?: string;
  username?: string;
  onUiStep: (step: SyncStep) => void;
  signal?: AbortSignal;
}): Promise<void> {
  void options.password;
  void options.username;
  void options.signal;
  options.onUiStep({ label: "Conectando…", progress: 20 });
  throw new ApiClientError(
    "Não foi possível sincronizar agora. Tente novamente em alguns minutos.",
    "SIGAA_OFFLINE",
    503
  );
}
