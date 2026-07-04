import {
  clearTurmasOfertadasForSemestre,
  getDisciplinas,
  getTurmasOfertadas,
  saveTurmaOfertada,
} from "@/lib/db/queries";
import type { TurmasOfertadasSnapshot } from "@/lib/scraper/types/turmas-ofertadas";
import { classifyTurmaCategoria } from "@/lib/turmas-ofertadas/classify-turma-categoria";
import { findDisciplinaForTurmaOffer } from "@/lib/turmas-ofertadas/find-disciplina-for-turma-offer";
import { dedupeTurmasOfertadasItemsByResolvedCode } from "@/lib/turmas-ofertadas/normalize-turmas-ofertadas-items";
import { isTurmasOfertadasSnapshotPersistable } from "@/lib/sync/turmas-ofertadas-snapshot-policy";

export interface PersistTurmasOfertadasResult {
  persisted: boolean;
  rowsWritten: number;
  reason?: string;
}

export function persistTurmasOfertadasSnapshot(
  snapshot: TurmasOfertadasSnapshot
): PersistTurmasOfertadasResult {
  if (!isTurmasOfertadasSnapshotPersistable(snapshot)) {
    const remaining = getTurmasOfertadas(snapshot.semestreAlvo).length;
    return {
      persisted: false,
      rowsWritten: 0,
      reason:
        snapshot.unavailableReason ??
        (remaining > 0
          ? "Não foi possível atualizar agora. Mantendo a última lista válida do SIGAA."
          : "Não foi possível buscar turmas no SIGAA."),
    };
  }

  clearTurmasOfertadasForSemestre(snapshot.semestreAlvo);
  const disciplinas = getDisciplinas();
  const turmas = dedupeTurmasOfertadasItemsByResolvedCode(
    snapshot.turmas,
    (item) =>
      findDisciplinaForTurmaOffer(
        item.codigoDisciplina,
        item.nome,
        disciplinas
      )?.codigo ?? item.codigoDisciplina
  );

  for (const turma of turmas) {
    const disciplina = findDisciplinaForTurmaOffer(
      turma.codigoDisciplina,
      turma.nome,
      disciplinas
    );
    const categoria = classifyTurmaCategoria(disciplina);

    saveTurmaOfertada({
      turma_sigaa_id: turma.turmaSigaaId,
      sigaa_componente: turma.sigaaComponente,
      codigo_disciplina: turma.codigoDisciplina,
      nome: turma.nome,
      turma_codigo: turma.turmaCodigo,
      semestre: turma.semestre,
      codigo_horario: turma.codigoHorario,
      horario_exibicao: turma.horarioExibicao,
      local: turma.local,
      professor: turma.professor,
      vagas: turma.vagas,
      vagas_ocupadas: turma.vagasOcupadas,
      carga_horaria: turma.cargaHoraria,
      situacao: turma.situacao,
      tipo_turma: turma.tipoTurma,
      departamento: turma.departamento,
      horario_indefinido: turma.horarioIndefinido ? 1 : 0,
      categoria,
      curso_id: "eng-computacao",
      synced_at: snapshot.scrapedAt,
    });
  }

  console.info(
    `[turmas] Persistidas ${turmas.length} turma(s) (${snapshot.semestreAlvo}).`
  );

  return {
    persisted: true,
    rowsWritten: turmas.length,
  };
}
