export type TaskSubmissionPollStatus = "queued" | "running" | "completed" | "failed";

export interface TaskSubmissionPollResult {
  status: TaskSubmissionPollStatus;
  errorMessage: string | null;
}

export type SubmissionPollOutcome =
  | { kind: "completed"; message: string }
  | { kind: "failed"; message: string }
  | { kind: "timeout"; message: string };

const SUBMISSION_POLL_ATTEMPTS = 90;
const SUBMISSION_POLL_INTERVAL_MS = 2000;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pollTaskSubmissionUntilDone(
  fetchStatus: () => Promise<TaskSubmissionPollResult>,
  options: { dryRun: boolean }
): Promise<SubmissionPollOutcome> {
  for (let attempt = 0; attempt < SUBMISSION_POLL_ATTEMPTS; attempt += 1) {
    await sleep(SUBMISSION_POLL_INTERVAL_MS);
    const status = await fetchStatus();
    if (status.status === "completed") {
      return {
        kind: "completed",
        message: options.dryRun
          ? "Validação OK: a tarefa foi aberta e o arquivo foi anexado (ainda sem enviar no SIGAA)."
          : "Tarefa enviada ao SIGAA com sucesso.",
      };
    }
    if (status.status === "failed") {
      return {
        kind: "failed",
        message:
          status.errorMessage?.trim() ||
          "Não foi possível concluir o envio. Tente novamente em instantes.",
      };
    }
  }

  return {
    kind: "timeout",
    message:
      "O envio está demorando mais do que o esperado. Confira no SIGAA se a tarefa chegou ou tente enviar de novo.",
  };
}
