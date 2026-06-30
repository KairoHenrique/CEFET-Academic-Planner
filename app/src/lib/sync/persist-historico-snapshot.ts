import {
  clearHistorico,
  saveHistorico,
  upsertSyncedIntegralizacao,
} from "@/lib/db/queries";
import { resolveDisciplinaCodigoByNome } from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";
import type { HistoricoSnapshot } from "@/lib/scraper/types/historico";

/**
 * Mapeia as situações do PDF do SIGAA para os status da tabela historico no DB.
 */
function mapSituacaoToStatus(situacao: string): "aprovado" | "reprovado" | "trancado" | "cancelado" | null {
  switch (situacao.toUpperCase()) {
    case "APR":
    case "APRN":
    case "DISP":
    case "CUMP":
    case "TRANS":
    case "INCORP":
      return "aprovado";

    case "REP":
    case "REPF":
    case "REPMF":
    case "REPN":
    case "REPNF":
      return "reprovado";

    case "TRANC":
      return "trancado";

    case "CANC":
      return "cancelado";

    // MATR (matriculado) não vai para o histórico, fica no semestre atual
    // REC (recuperação) ainda não tem status final
    case "MATR":
    case "REC":
    default:
      return null;
  }
}

export function persistHistoricoSnapshot(snapshot: HistoricoSnapshot): void {
  // 1. Atualizar Histórico de Matérias Cursadas
  clearHistorico();

  for (const disciplina of snapshot.disciplinas) {
    const status = mapSituacaoToStatus(disciplina.situacao);
    
    // Ignora matérias que o aluno está cursando agora ou sem status final claro
    if (!status) continue;

    // Resolve o código oficial do PPC a partir do nome extraído se não houver código
    const disciplinaId = disciplina.codigo || resolveDisciplinaCodigoByNome(disciplina.nome);

    saveHistorico({
      disciplina_id: disciplinaId,
      semestre: disciplina.semestre,
      status: status,
      nota_final: disciplina.media,
    });
  }

  // 2. Atualizar Progresso de Integralização (mais preciso do PDF que do portal)
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
