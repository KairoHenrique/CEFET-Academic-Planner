import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loginSigaaOnPage } from "@/lib/scraper/auth";
import { submitPortalTarefa } from "@/lib/scraper/portal-discente/submit-portal-tarefa";
import { withSyncBrowser } from "@/lib/scraper/session-context";
import { mapUnknownScraperError } from "@/lib/scraper/errors";
import {
  dismissSigaaBlockingOverlays,
  dismissSigaaCookieBanner,
} from "@/lib/scraper/turma-virtual/portal-turma-navigation";
import { pgGetTarefaById, pgUpdateTarefaConcluida } from "@/lib/db/postgres/queries-write";
import {
  pgGetTaskSubmission,
  pgMarkTaskSubmissionCompleted,
  pgMarkTaskSubmissionFailed,
  pgMarkTaskSubmissionRunning,
} from "@/lib/task-submissions/task-submissions-store";

export async function runSubmitTarefaJob(input: {
  username: string;
  password: string;
  submissionId: string;
  dryRun?: boolean;
}): Promise<{ message: string }> {
  const submission = await pgGetTaskSubmission(input.submissionId);
  if (!submission) {
    throw new Error("Envio não encontrado.");
  }

  await pgMarkTaskSubmissionRunning(input.submissionId);

  const tempPath = join(
    tmpdir(),
    `acme-submit-${input.submissionId}-${submission.fileName}`
  );

  try {
    await writeFile(tempPath, submission.fileBytes);
    const tarefa = await pgGetTarefaById(submission.tarefaId);
    const dryRun = input.dryRun === true;

    await withSyncBrowser(async (page) => {
      await loginSigaaOnPage(page, {
        username: input.username,
        password: input.password,
      });
      await dismissSigaaCookieBanner(page);
      await dismissSigaaBlockingOverlays(page);

      await submitPortalTarefa({
        page,
        sigaaLinkId: submission.sigaaLinkId,
        tarefaTitulo: tarefa?.titulo ?? null,
        filePath: tempPath,
        comment: submission.commentText ?? undefined,
        dryRun,
      });
    });

    if (!dryRun) {
      await pgUpdateTarefaConcluida(submission.tarefaId, true);
    }
    await pgMarkTaskSubmissionCompleted(input.submissionId);

    return {
      message: dryRun
        ? "Validação OK: a tarefa foi aberta e o arquivo foi anexado (ainda sem enviar no SIGAA)."
        : "Tarefa enviada ao SIGAA com sucesso.",
    };
  } catch (error) {
    const mapped = mapUnknownScraperError(error);
    await pgMarkTaskSubmissionFailed(input.submissionId, mapped.message);
    throw mapped;
  } finally {
    await unlink(tempPath).catch(() => undefined);
  }
}
