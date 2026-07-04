import { apiSuccess } from "@/lib/api/response";

export function buildCloudSyncQueueStubResponse() {
  return apiSuccess({
    ok: true as const,
    stub: true as const,
    reused: false,
    job: null,
    message:
      "Fila sync SQLite indisponível no modo cloud. Use worker externo (B54) quando deployado.",
  });
}

export function buildCloudSyncQueueJobStubResponse(jobId: string) {
  return apiSuccess({
    ok: true as const,
    stub: true as const,
    job: null,
    jobId,
    message: "Consulta de fila SQLite indisponível no modo cloud.",
  });
}
