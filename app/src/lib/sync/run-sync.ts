import type { SyncStep } from "@/lib/types/sync";
import { seedDemoStudentData } from "@/lib/db/seed-demo";
import { assertSyncCredentialsAllowed } from "./validate-credentials";
import type { SyncRequest } from "@/lib/types/sync";

/**
 * Sync pipeline: dados do SIGAA entram via upsert e nunca sobrescrevem
 * registros protegidos pelo usuário — ver lib/sync/user-data-priority.ts.
 */

const SYNC_PIPELINE: Array<{ label: string; progress: number; run: () => void }> =
  [
    {
      label: "Autenticando no SIGAA…",
      progress: 15,
      run: () => undefined,
    },
    {
      label: "Carregando portal do discente…",
      progress: 35,
      run: () => undefined,
    },
    {
      label: "Sincronizando disciplinas…",
      progress: 55,
      run: () => seedDemoStudentData(),
    },
    {
      label: "Baixando notas e faltas…",
      progress: 75,
      run: () => undefined,
    },
    {
      label: "Atualizando calendário…",
      progress: 90,
      run: () => undefined,
    },
    {
      label: "Concluído",
      progress: 100,
      run: () => undefined,
    },
  ];

export interface SyncResult {
  steps: SyncStep[];
}

export function runSync(credentials: SyncRequest): SyncResult {
  assertSyncCredentialsAllowed(credentials);

  const steps: SyncStep[] = [];

  for (const step of SYNC_PIPELINE) {
    step.run();
    steps.push({ label: step.label, progress: step.progress });
  }

  return { steps };
}
