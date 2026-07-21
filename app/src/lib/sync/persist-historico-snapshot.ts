import {
  clearHistorico,
  getDisciplinas,
  saveHistorico,
  upsertSyncedIntegralizacao,
  upsertPortalDisciplina,
} from "@/lib/db/queries";
import { persistSigaaIntegralizacaoResumo } from "@/lib/integralizacao/sigaa-ch-config";
import { resolveDisciplinaCodigoForHistorico, isPpcCanonicalCodigo } from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";
import type { HistoricoSnapshot } from "@/lib/scraper/types/historico";
import { isHistoricoSnapshotPersistable } from "@/lib/sync/historico-snapshot-policy";

export interface PersistHistoricoResult {
  persisted: boolean;
  rowsWritten: number;
  rowsSkipped?: number;
  reason?: string;
}

/**
 * Mapeia as situações do PDF do SIGAA para os status da tabela historico no DB.
 */
function mapSituacaoToStatus(
  situacao: string
): "aprovado" | "reprovado" | "trancado" | "cancelado" | "cursando" | null {
  switch (situacao.toUpperCase()) {
    case "APR":
    case "APRN":
    case "APROVADO":
    case "DISP":
    case "DISPENSADO":
    case "CUMP":
    case "CUMPRIDO":
    case "TRANS":
    case "INCORP":
    case "INCORPORADO":
      return "aprovado";

    case "REP":
    case "REPF":
    case "REPMF":
    case "REPN":
    case "REPNF":
    case "REPROVADO":
      return "reprovado";

    case "TRANC":
    case "TRANCADO":
      return "trancado";

    case "CANC":
    case "CANCELADO":
      return "cancelado";

    case "MATR":
    case "MATRICULADO":
      return "cursando";

    case "REC":
    default:
      // Pode ser reprovado por falta, etc, mas tentamos um fallback:
      if (situacao.toUpperCase().includes("APROVADO")) return "aprovado";
      if (situacao.toUpperCase().includes("REPROVADO")) return "reprovado";
      if (situacao.toUpperCase().includes("DISPENSADO")) return "aprovado";
      return null;
  }
}

export function persistHistoricoSnapshot(
  snapshot: HistoricoSnapshot
): PersistHistoricoResult {
  if (!isHistoricoSnapshotPersistable(snapshot)) {
    return {
      persisted: false,
      rowsWritten: 0,
      reason: "Snapshot vazio ou sem disciplinas com situação final.",
    };
  }

  let rowsWritten = 0;
  let rowsSkipped = 0;
  const validDisciplinaIds = new Set(getDisciplinas().map((row) => row.codigo));
  const pendingRows: Array<{
    disciplina_id: string;
    semestre: string;
    status: "aprovado" | "reprovado" | "trancado" | "cancelado" | "cursando";
    nota_final: number | null;
  }> = [];

  for (const disciplina of snapshot.disciplinas) {
    const status = mapSituacaoToStatus(disciplina.situacao);
    if (!status) continue;

    const disciplinaId = resolveDisciplinaCodigoForHistorico(
      disciplina.nome,
      disciplina.codigo,
      disciplina.ch
    );
    if (!isPpcCanonicalCodigo(disciplinaId) || !validDisciplinaIds.has(disciplinaId)) {
      // It's an extra/optative subject not in the PPC catalog
      upsertPortalDisciplina({
        codigo: disciplinaId,
        nome: disciplina.nome,
      });
      // We also update validDisciplinaIds so we don't insert it again during this run
      validDisciplinaIds.add(disciplinaId);
    }

    pendingRows.push({
      disciplina_id: disciplinaId,
      semestre: disciplina.semestre,
      status,
      nota_final: disciplina.media,
    });
  }

  if (pendingRows.length === 0) {
    console.warn(
      `[historico] ${snapshot.disciplinas.length} parseada(s), 0 mapeáveis ao PPC — histórico anterior preservado.`
    );
    return {
      persisted: false,
      rowsWritten: 0,
      rowsSkipped,
      reason: "Nenhuma disciplina mapeou ao PPC.",
    };
  }

  clearHistorico();
  for (const row of pendingRows) {
    saveHistorico(row);
    rowsWritten += 1;
  }

  console.info(
    `[historico] Persistidas ${rowsWritten} disciplina(s)` +
      (rowsSkipped > 0 ? `, ${rowsSkipped} ignorada(s).` : ".")
  );

  if (snapshot.chResumo.length > 0) {
    for (const resumo of snapshot.chResumo) {
      upsertSyncedIntegralizacao({
        tipo_ch: resumo.tipo,
        concluido: resumo.integralizado,
        pendente: resumo.pendente,
        total_necessario: resumo.exigido,
        manual: 0,
      });
    }
  }

  if (snapshot.chTotais && snapshot.chTotais.exigido > 0) {
    const { exigido, integralizado } = snapshot.chTotais;
    persistSigaaIntegralizacaoResumo({
      totalCurriculo: exigido,
      percentIntegralizado: Math.round((integralizado / exigido) * 100),
      totalIntegralizado: integralizado,
      fromHistoricoPdf: true,
    });
  }

  return { persisted: true, rowsWritten };
}
