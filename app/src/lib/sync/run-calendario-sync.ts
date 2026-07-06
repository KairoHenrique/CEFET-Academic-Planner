import { loginSigaaOnPage } from "@/lib/scraper/auth";
import { SIGAA_SCRAPER_MOCK } from "@/lib/scraper/constants";
import {
  scrapeCalendarioAcademico,
  scrapeCalendarioAcademicoMock,
} from "@/lib/scraper/calendario/scrape-calendario";
import { withSyncBrowser } from "@/lib/scraper/session-context";
import { shouldRunCalendarioSync } from "@/lib/sync/calendario-sync-plan";
import { persistCalendarioSnapshot } from "@/lib/sync/persist-calendario-snapshot";
import { recordCalendarioSyncedAt } from "@/lib/sync/sync-preferences";
import { getCalendarioAcademico, purgeInvalidCalendarioAcademico } from "@/lib/db/queries";
import { resolveSyncCredentialsSync, type ResolvedSyncCredentials } from "@/lib/sync/resolve-credentials";
import { runMirrorAfterSync } from "@/lib/sync-mirror/run-mirror-after-sync";
import type { SyncRequest } from "@/lib/types/sync";

export interface RunCalendarioSyncOptions {
  force?: boolean;
  referenceDate?: Date;
}

export interface CalendarioSyncResult {
  ok: boolean;
  skipped: boolean;
  partial: boolean;
  rowsWritten: number;
  message: string;
}

function buildSkippedResult(message: string): CalendarioSyncResult {
  return {
    ok: true,
    skipped: true,
    partial: false,
    rowsWritten: 0,
    message,
  };
}

function tryFallbackCalendarioMock(
  options: RunCalendarioSyncOptions,
  reason?: string
): CalendarioSyncResult {
  if (getCalendarioAcademico().length > 0) {
    return {
      ok: false,
      skipped: false,
      partial: true,
      rowsWritten: 0,
      message:
        reason ??
        "Calendário acadêmico indisponível no SIGAA (eventos válidos preservados).",
    };
  }

  const mockSnapshot = scrapeCalendarioAcademicoMock(options.referenceDate);
  const mockResult = persistCalendarioSnapshot(mockSnapshot);

  if (!mockResult.persisted) {
    return {
      ok: false,
      skipped: false,
      partial: true,
      rowsWritten: 0,
      message: reason ?? "Calendário acadêmico indisponível no SIGAA.",
    };
  }

  recordCalendarioSyncedAt();
  return {
    ok: true,
    skipped: false,
    partial: true,
    rowsWritten: mockResult.rowsWritten,
    message:
      "Calendário SIGAA indisponível — datas institucionais de referência aplicadas.",
  };
}

async function executeCalendarioRobot(
  credentials: ResolvedSyncCredentials,
  options: RunCalendarioSyncOptions
): Promise<CalendarioSyncResult> {
  if (SIGAA_SCRAPER_MOCK) {
    const snapshot = scrapeCalendarioAcademicoMock(options.referenceDate);
    const result = persistCalendarioSnapshot(snapshot);
    if (!result.persisted) {
      return {
        ok: false,
        skipped: false,
        partial: true,
        rowsWritten: 0,
        message: result.reason ?? "Calendário mock indisponível.",
      };
    }

    recordCalendarioSyncedAt();
    return {
      ok: true,
      skipped: false,
      partial: false,
      rowsWritten: result.rowsWritten,
      message: `Calendário acadêmico atualizado (${result.rowsWritten} eventos).`,
    };
  }

  return withSyncBrowser(async (page) => {
    await loginSigaaOnPage(page, credentials);

    const snapshot = await scrapeCalendarioAcademico(page, {
      skipPortalGoto: false,
      referenceDate: options.referenceDate,
    });
    const result = persistCalendarioSnapshot(snapshot);

    if (!result.persisted) {
      return tryFallbackCalendarioMock(options, result.reason);
    }

    recordCalendarioSyncedAt();
    return {
      ok: true,
      skipped: false,
      partial: false,
      rowsWritten: result.rowsWritten,
      message: `Calendário acadêmico atualizado (${result.rowsWritten} eventos).`,
    };
  });
}

/**
 * Robô B66 isolado — não passa pelo pipeline portal/turma/histórico.
 */
export async function runCalendarioSync(
  input: SyncRequest,
  options: RunCalendarioSyncOptions = {}
): Promise<CalendarioSyncResult> {
  const credentials = resolveSyncCredentialsSync(input);

  const purged = purgeInvalidCalendarioAcademico();
  if (purged > 0) {
    console.info(`[sync:calendario] Removidos ${purged} registro(s) inválido(s).`);
  }

  if (
    !shouldRunCalendarioSync({
      force: options.force,
      referenceDate: options.referenceDate,
    })
  ) {
    return buildSkippedResult(
      "Calendário acadêmico em dia — sync não necessário."
    );
  }

  console.info(
    `[sync:calendario] modo=${SIGAA_SCRAPER_MOCK ? "MOCK" : "LIVE"} user=${credentials.username}`
  );

  const result = await executeCalendarioRobot(credentials, options);

  if (result.rowsWritten > 0) {
    await runMirrorAfterSync(credentials.username);
  }

  return result;
}
