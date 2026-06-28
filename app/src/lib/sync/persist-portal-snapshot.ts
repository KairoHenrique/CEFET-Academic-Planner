import { pickStablePaletteColor } from "@/lib/colors/palette";
import {
  SUBJECT_DISPLAY_GRADE_MAX,
  SUBJECT_DISPLAY_PASSING_GRADE,
} from "@/lib/disciplinas/grade-display";
import { resolveDisciplinaCodigoByNome } from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";
import {
  clearPortalSyncedData,
  pruneSyncedSemestreAtual,
  saveAluno,
  saveDisciplina,
  upsertSyncedIntegralizacao,
  upsertSyncedSemestreAtual,
  upsertSyncedTarefa,
} from "@/lib/db/queries";
import { seedPpcIfEmpty } from "@/lib/db/seed-ppc";
import type { PortalDiscenteSnapshot } from "@/lib/scraper/types/portal-discente";

export function persistPortalSnapshot(snapshot: PortalDiscenteSnapshot): void {
  seedPpcIfEmpty();
  clearPortalSyncedData();

  saveAluno({
    matricula: snapshot.aluno.matricula,
    nome: snapshot.aluno.nome,
    curso: snapshot.aluno.curso,
    email: snapshot.aluno.email,
    semestre_entrada: snapshot.aluno.semestreEntrada,
    rg: snapshot.aluno.rg,
    status: snapshot.aluno.status,
  });

  for (const item of snapshot.integralizacao) {
    upsertSyncedIntegralizacao({
      tipo_ch: item.tipoCh,
      total_necessario: item.totalNecessario,
      concluido: item.concluido,
      pendente: item.pendente,
      manual: 0,
    });
  }

  const activeDisciplinaIds: string[] = [];

  for (const disciplina of snapshot.semestreAtual) {
    const codigo = resolveDisciplinaCodigoByNome(disciplina.codigo || disciplina.nome);
    activeDisciplinaIds.push(codigo);

    saveDisciplina({
      codigo,
      nome: disciplina.nome,
      tipo: "Obrigatória",
      carga_horaria: null,
      periodo: null,
      ementa: null,
    });

    upsertSyncedSemestreAtual({
      disciplina_id: codigo,
      local: disciplina.local,
      codigo_horario: disciplina.codigoHorario,
      horario_traduzido: disciplina.horarioTraduzido,
      cor: pickStablePaletteColor(codigo),
      apelido: null,
      nome_exibicao: null,
      professor: null,
      max_faltas: null,
      nota_maxima: SUBJECT_DISPLAY_GRADE_MAX,
      nota_aprovacao: SUBJECT_DISPLAY_PASSING_GRADE,
      arquivos_baixados: 0,
      pdf_auto_download: 0,
    });
  }

  pruneSyncedSemestreAtual(activeDisciplinaIds);

  for (const atividade of snapshot.atividades) {
    const disciplinaId = resolveDisciplinaCodigoByNome(atividade.disciplinaCodigo);
    upsertSyncedTarefa({
      disciplina_id: disciplinaId,
      titulo: atividade.titulo,
      descricao: atividade.descricao,
      data_inicio: null,
      data_fim: atividade.dataFim,
      hora_fim: atividade.horaFim ?? "23:59",
      tipo: atividade.tipo,
      possui_nota: 0,
      concluida: 0,
      manual: 0,
      instrucoes: null,
      entregaveis: null,
      pontuacao_maxima: null,
    });
  }
}
