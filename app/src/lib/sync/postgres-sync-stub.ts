import { apiSuccess } from "@/lib/api/response";

export function buildPostgresSyncStubResponse() {
  return apiSuccess({
    ok: true as const,
    stub: true as const,
    steps: [
      {
        step: "cloud-sync",
        status: "skipped" as const,
        message:
          "Modo Postgres (6a): sync SIGAA roda no worker externo. SQLite local ou fila worker até deploy completo.",
      },
    ],
    jobId: null,
  });
}
