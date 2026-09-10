export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import { ApiError, unauthorizedError, validationError } from "@/lib/api/errors";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import { enforceSubscriptionAccessGate } from "@/lib/auth/access/access-gate";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { getPostgresPool } from "@/lib/db/postgres/pool";
import { buildIngestSnapshotFromPortal } from "@/lib/device-sync/build-ingest-snapshot";
import { parseCalendarioHtml } from "@/lib/scraper/calendario/parse-calendario-html";
import { extractPortalRawFromHtml } from "@/lib/scraper/portal-discente/extract-portal-raw";
import {
  assertPortalSnapshot,
  parsePortalPageData,
} from "@/lib/scraper/portal-discente/parse-portal-page";
import { resolveDisciplinaCodigoForPortal } from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";
import { parseFrequenciaPageHtml } from "@/lib/scraper/turma-virtual/parse-frequencia-page";
import { parseNotasPageHtml } from "@/lib/scraper/turma-virtual/parse-notas-page";
import { parseTarefasListPageHtml } from "@/lib/scraper/turma-virtual/parse-tarefas-page";
import { ingestUserSnapshotForProfile } from "@/lib/sync-ingest/ingest-user-snapshot";
import {
  filterPersistableCalendarioEventos,
  isCalendarioSnapshotPersistable,
} from "@/lib/sync/calendario-snapshot-policy";
import { persistRuSaldo } from "@/lib/sync/persist-ru-saldo";
import type { UserSqliteSnapshot } from "@/lib/sync-mirror/read-sqlite-snapshot";
import type { PortalDiscenteSnapshot } from "@/lib/scraper/types/portal-discente";

export const runtime = "nodejs";
export const maxDuration = 90;

const MAX_HTML_CHARS = 2_000_000;
const MAX_TURMA_HTMLS = 12;

/**
 * Ingest a partir do HTML raspado no aparelho (mobile/web).
 * O Cloudflare NÃO fala com o SIGAA — só recebe HTML e persiste.
 */
export const POST = async (request: Request) => {
  try {
    if (!isPostgresBackend()) {
      throw unauthorizedError("Ingest HTML só no deploy cloud/Postgres.");
    }

    await ensurePostgresReady();
    const profile = await resolveProfileFromAuthorization(
      request.headers.get("Authorization")
    );
    if (!profile) {
      throw unauthorizedError("Faça login para enviar o HTML do portal.");
    }
    await enforceSubscriptionAccessGate(profile);

    const body = (await request.json()) as Record<string, unknown>;
    const html = typeof body.portalHtml === "string" ? body.portalHtml : "";
    if (!html.trim()) {
      throw validationError("portalHtml é obrigatório.");
    }
    if (html.length > MAX_HTML_CHARS) {
      throw validationError("HTML do portal muito grande.");
    }

    const raw = extractPortalRawFromHtml(html);
    raw.html = html;
    const portal = parsePortalPageData(raw, profile.cursoId);
    assertPortalSnapshot(portal);
    const snapshot = buildIngestSnapshotFromPortal(portal);

    const refeicoes =
      typeof body.refeicoesDisponiveis === "number" &&
      Number.isFinite(body.refeicoesDisponiveis)
        ? Math.max(0, Math.floor(body.refeicoesDisponiveis))
        : null;

    if (refeicoes != null) {
      const syncedAt = new Date().toISOString();
      snapshot.aluno = {
        ...snapshot.aluno,
        refeicoes_disponiveis: refeicoes,
        ru_synced_at: syncedAt,
      };
    }

    const turmaHtmls = Array.isArray(body.turmaHtmls)
      ? body.turmaHtmls
          .filter((item): item is string => typeof item === "string")
          .slice(0, MAX_TURMA_HTMLS)
      : [];

    if (turmaHtmls.length > 0) {
      mergeTurmaHtmlsIntoSnapshot(snapshot, turmaHtmls, portal);
    }

    const result = await ingestUserSnapshotForProfile(profile, snapshot);

    if (refeicoes != null) {
      await persistRuSaldo({
        username: profile.cpf,
        refeicoesDisponiveis: refeicoes,
      });
    }

    const calendarioHtml =
      typeof body.calendarioHtml === "string" ? body.calendarioHtml : "";
    let calendarioRows = 0;
    if (calendarioHtml.trim().length > 800) {
      calendarioRows = await persistCalendarioHtmlGlobal(calendarioHtml);
    }

    return apiSuccess(
      {
        ...result,
        via: "portal-html" as const,
        calendarioRows,
        ruUpdated: refeicoes != null,
      },
      200
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return apiErrorResponse(error);
    }
    return apiErrorResponse(error);
  }
};

function mergeTurmaHtmlsIntoSnapshot(
  snapshot: UserSqliteSnapshot,
  turmaHtmls: string[],
  portal: PortalDiscenteSnapshot
): void {
  const matricula = portal.aluno.matricula ?? "";

  for (const turmaHtml of turmaHtmls) {
    if (turmaHtml.length > MAX_HTML_CHARS) continue;

    const nomeMatch = turmaHtml.match(
      /<title[^>]*>([^<]+)<\/title>|(?:Disciplina|Turma)\s*[:\-]\s*([^<\n]{4,120})/i
    );
    const sigaaNome = (nomeMatch?.[1] || nomeMatch?.[2] || "").trim();
    const codigo = resolveDisciplinaCodigoForPortal(null, sigaaNome);
    if (!codigo) continue;

    try {
      const notas = parseNotasPageHtml(turmaHtml, { matricula }).notas;
      for (const nota of notas) {
        snapshot.notasSynced.push({
          id: 0,
          disciplina_id: codigo,
          avaliacao_nome: nota.avaliacaoNome,
          nota_maxima: nota.notaMaxima,
          nota_obtida: nota.notaObtida,
          manual: 0,
        });
      }
    } catch {
      /* ignore */
    }

    try {
      const faltas = parseFrequenciaPageHtml(turmaHtml);
      for (const falta of faltas) {
        snapshot.faltasSynced.push({
          id: 0,
          disciplina_id: codigo,
          data: falta.data,
          status: falta.status,
          quantidade: falta.quantidade ?? 1,
          manual: 0,
        });
      }
    } catch {
      /* ignore */
    }

    try {
      const tarefas = parseTarefasListPageHtml(turmaHtml);
      for (const tarefa of tarefas) {
        snapshot.tarefasSynced.push({
          id: 0,
          disciplina_id: codigo,
          titulo: tarefa.titulo,
          descricao: tarefa.descricao ?? null,
          data_inicio: tarefa.dataInicio ?? null,
          data_fim: tarefa.dataFim ?? null,
          hora_fim: tarefa.horaFim ?? null,
          tipo: tarefa.tipo ?? null,
          possui_nota: tarefa.possuiNota ? 1 : 0,
          concluida: 0,
          manual: 0,
          instrucoes:
            tarefa.instrucoes.length > 0
              ? JSON.stringify(tarefa.instrucoes)
              : null,
          entregaveis:
            tarefa.entregaveis.length > 0
              ? JSON.stringify(tarefa.entregaveis)
              : null,
          pontuacao_maxima: tarefa.pontuacaoMaxima,
          sigaa_link_id: null,
        });
      }
    } catch {
      /* ignore */
    }
  }
}

async function persistCalendarioHtmlGlobal(html: string): Promise<number> {
  try {
    const parsed = parseCalendarioHtml(html, { semestreAlvo: [] });
    if (!isCalendarioSnapshotPersistable(parsed)) return 0;
    const eventos = filterPersistableCalendarioEventos(parsed);
    if (eventos.length === 0) return 0;

    // Só atualiza cache global se ainda estiver vazio/frio (TTL simples: < 1 evento).
    const pool = getPostgresPool();
    const existing = await pool.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM calendario_academico`
    );
    const count = Number(existing.rows[0]?.n ?? 0);
    if (count >= 3) {
      // Cache ainda útil — não sobrescreve com parse parcial do aparelho.
      return 0;
    }

    await pool.query(`DELETE FROM calendario_academico`);
    let written = 0;
    for (const evento of eventos) {
      await pool.query(
        `INSERT INTO calendario_academico
           (evento, data_inicio, data_fim, semestre)
         VALUES ($1, $2, $3, $4)`,
        [evento.evento, evento.dataInicio, evento.dataFim, evento.semestre]
      );
      written += 1;
    }
    return written;
  } catch (err) {
    console.warn("[ingest-html] Calendário ignorado:", err);
    return 0;
  }
}
