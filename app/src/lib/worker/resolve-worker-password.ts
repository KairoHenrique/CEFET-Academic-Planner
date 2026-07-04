import { validationError } from "@/lib/api/errors";
import { openQueuePassword } from "@/lib/sync-queue/queue-credential-seal";
import type { WorkerJobRequest } from "@/lib/worker/job-types";

export function resolveWorkerJobPassword(request: WorkerJobRequest): string {
  if (request.passwordEnc?.trim()) {
    return openQueuePassword(request.passwordEnc);
  }

  if (request.password) {
    return request.password;
  }

  throw validationError("Informe passwordEnc ou password no job do worker.");
}
