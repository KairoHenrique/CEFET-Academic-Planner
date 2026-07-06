import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import { loginSigaaOnPage } from "@/lib/scraper/auth";
import { SIGAA_SCRAPER_MOCK } from "@/lib/scraper/constants";
import {
  scrapeTurmasOfertadas,
  scrapeTurmasOfertadasMock,
} from "@/lib/scraper/turmas-ofertadas/scrape-turmas-ofertadas";
import { withSyncBrowser } from "@/lib/scraper/session-context";
import { getTurmasOfertadas } from "@/lib/db/queries";
import { persistTurmasOfertadasSnapshot } from "@/lib/sync/persist-turmas-ofertadas-snapshot";
import { shouldRunTurmasOfertadasSync } from "@/lib/sync/turmas-ofertadas-sync-plan";
import { recordTurmasOfertadasSyncedAt } from "@/lib/sync/sync-preferences";
import { resolveSyncCredentialsSync, type ResolvedSyncCredentials } from "@/lib/sync/resolve-credentials";
import { runMirrorAfterSync } from "@/lib/sync-mirror/run-mirror-after-sync";
import type { SyncRequest } from "@/lib/types/sync";

export interface RunTurmasOfertadasSyncOptions {
  force?: boolean;
  referenceDate?: Date;
}

export interface TurmasOfertadasSyncResult {
  ok: boolean;
  skipped: boolean;
  partial: boolean;
  /** Turmas exibidas são valores de exemplo — SIGAA indisponível ou parse falhou. */
  usedExampleData?: boolean;
  rowsWritten: number;
  message: string;
}

function buildSkippedResult(message: string): TurmasOfertadasSyncResult {
  return {
    ok: true,
    skipped: true,
    partial: false,
    rowsWritten: 0,
    message,
  };
}

async function tryFallbackTurmasMock(
  options: RunTurmasOfertadasSyncOptions,
  reason?: string
): Promise<TurmasOfertadasSyncResult> {
  const referenceDate = options.referenceDate ?? new Date();
  const semestreAlvo = resolveNextAcademicSemesterLabel(referenceDate);
  const existing = getTurmasOfertadas(semestreAlvo);

  if (existing.length > 0) {
    return {
      ok: false,
      skipped: false,
      partial: true,
      rowsWritten: 0,
      message:
        reason ??
        "Não foi possível atualizar agora. Mantendo a última lista válida do SIGAA.",
    };
  }

  const mockSnapshot = scrapeTurmasOfertadasMock(referenceDate);
  const mockResult = await persistTurmasOfertadasSnapshot(mockSnapshot);

  if (!mockResult.persisted) {
    return {
      ok: false,
      skipped: false,
      partial: true,
      rowsWritten: 0,
      message:
        reason ??
        "Não foi possível buscar turmas no SIGAA. Tente atualizar novamente mais tarde.",
    };
  }

  recordTurmasOfertadasSyncedAt();
  return {
    ok: true,
    skipped: false,
    partial: true,
    usedExampleData: true,
    rowsWritten: mockResult.rowsWritten,
    message:
      "Não foi possível buscar turmas no SIGAA agora. Exibindo valores de exemplo para você montar a grade.",
  };
}

async function executeTurmasRobot(
  credentials: ResolvedSyncCredentials,
  options: RunTurmasOfertadasSyncOptions
): Promise<TurmasOfertadasSyncResult> {
  if (SIGAA_SCRAPER_MOCK) {
    const snapshot = scrapeTurmasOfertadasMock(options.referenceDate);
    const result = await persistTurmasOfertadasSnapshot(snapshot);
    if (!result.persisted) {
      return {
        ok: false,
        skipped: false,
        partial: true,
        rowsWritten: 0,
        message: result.reason ?? "Turmas mock indisponíveis.",
      };
    }

    recordTurmasOfertadasSyncedAt();
    return {
      ok: true,
      skipped: false,
      partial: false,
      rowsWritten: result.rowsWritten,
      message: `Turmas ofertadas atualizadas (${result.rowsWritten} turmas).`,
    };
  }

  return withSyncBrowser(async (page) => {
    await loginSigaaOnPage(page, credentials);

    const snapshot = await scrapeTurmasOfertadas(page, {
      skipPortalGoto: false,
      referenceDate: options.referenceDate,
    });
    const result = await persistTurmasOfertadasSnapshot(snapshot);

    if (!result.persisted) {
      return tryFallbackTurmasMock(options, result.reason);
    }

    recordTurmasOfertadasSyncedAt();
    return {
      ok: true,
      skipped: false,
      partial: false,
      rowsWritten: result.rowsWritten,
      message: `Turmas ofertadas atualizadas (${result.rowsWritten} turmas).`,
    };
  });
}

/**
 * Robô B67 isolado — não passa pelo pipeline portal/turma/histórico.
 */
export async function runTurmasOfertadasSync(
  input: SyncRequest,
  options: RunTurmasOfertadasSyncOptions = {}
): Promise<TurmasOfertadasSyncResult> {
  const credentials = resolveSyncCredentialsSync(input);

  if (
    !shouldRunTurmasOfertadasSync({
      force: options.force,
      referenceDate: options.referenceDate,
    })
  ) {
    return buildSkippedResult(
      "Turmas ofertadas em dia — sync não necessário."
    );
  }

  console.info(
    `[sync:turmas] modo=${SIGAA_SCRAPER_MOCK ? "MOCK" : "LIVE"} user=${credentials.username}`
  );

  const result = await executeTurmasRobot(credentials, options);

  if (result.rowsWritten > 0) {
    await runMirrorAfterSync(credentials.username);
  }

  return result;
}
