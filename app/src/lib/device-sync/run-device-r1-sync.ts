import { buildIngestSnapshotFromPortal } from "@/lib/device-sync/build-ingest-snapshot";
import {
  DeviceHttpSession,
  type DeviceFetch,
} from "@/lib/device-sync/http-session";
import { loginSigaaHttp } from "@/lib/device-sync/login-sigaa-http";
import { scrapePortalDiscenteHttp } from "@/lib/device-sync/scrape-portal-http";
import type { UserSqliteSnapshot } from "@/lib/sync-mirror/read-sqlite-snapshot";
import type { SyncStep } from "@/lib/types/sync";

export interface RunDeviceR1SyncInput {
  username: string;
  password: string;
  cursoId?: string;
  fetchImpl?: DeviceFetch;
  onStep?: (step: SyncStep) => void;
}

export interface RunDeviceR1SyncResult {
  snapshot: UserSqliteSnapshot;
  steps: SyncStep[];
}

function emit(
  steps: SyncStep[],
  onStep: ((step: SyncStep) => void) | undefined,
  label: string,
  progress: number
): void {
  const step = { label, progress };
  steps.push(step);
  onStep?.(step);
}

/**
 * Pipeline R1 lite no aparelho: login HTTP → portal → snapshot de ingest.
 */
export async function runDeviceR1Sync(
  input: RunDeviceR1SyncInput
): Promise<RunDeviceR1SyncResult> {
  const steps: SyncStep[] = [];
  const session = new DeviceHttpSession({ fetchImpl: input.fetchImpl });

  emit(steps, input.onStep, "Conectando ao SIGAA (aparelho)…", 10);
  await loginSigaaHttp(session, {
    username: input.username,
    password: input.password,
  });

  emit(steps, input.onStep, "Lendo portal do discente…", 45);
  const portal = await scrapePortalDiscenteHttp(session, input.cursoId);

  emit(steps, input.onStep, "Montando snapshot…", 75);
  const snapshot = buildIngestSnapshotFromPortal(portal);

  emit(steps, input.onStep, "Pronto para enviar à nuvem…", 90);
  return { snapshot, steps };
}
