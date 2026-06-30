import { pickStablePaletteColor } from "@/lib/colors/palette";
import { suggestSubjectNickname } from "@/lib/disciplinas/subject-display-name";
import {
  SUBJECT_DISPLAY_GRADE_MAX,
  SUBJECT_DISPLAY_PASSING_GRADE,
} from "@/lib/disciplinas/grade-display";
import {
  normalizeDisciplinaNome,
  resolveDisciplinaCodigoByNome,
  resolveDisciplinaCodigoFromSemestre,
} from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";
import {
  clearPortalSyncedData,
  pruneSyncedSemestreAtual,
  saveAluno,
  upsertPortalDisciplina,
  upsertSyncedIntegralizacao,
  upsertSyncedSemestreAtual,
  upsertSyncedTarefa,
} from "@/lib/db/queries";
import { persistSigaaIntegralizacaoResumo } from "@/lib/integralizacao/sigaa-ch-config";
import { seedPpcIfEmpty } from "@/lib/db/seed-ppc";
import { isAtividadePrazoVencido } from "@/lib/tasks/dates";
import { ensureStudentSyncIsolation } from "@/lib/sync/student-isolation";
import type { PortalDiscenteSnapshot } from "@/lib/scraper/types/portal-discente";

function buildSemestreCodigoByNome(
  snapshot: PortalDiscenteSnapshot
): Map<string, string> {
  const map = new Map<string, string>();

  for (const disciplina of snapshot.semestreAtual) {
    const codigo = resolveDisciplinaCodigoByNome(
      disciplina.codigo || disciplina.nome
    );
    map.set(normalizeDisciplinaNome(disciplina.nome), codigo);
  }

  return map;
}

export function persistPortalSnapshot(snapshot: PortalDiscenteSnapshot): void {
  ensureStudentSyncIsolation(snapshot.aluno.matricula);
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

  persistSigaaIntegralizacaoResumo(snapshot.integralizacaoResumo);

  const activeDisciplinaIds = new Set<string>();
  const semestreByNome = buildSemestreCodigoByNome(snapshot);

  for (const disciplina of snapshot.semestreAtual) {
    const codigo = resolveDisciplinaCodigoByNome(
      disciplina.codigo || disciplina.nome
    );
    activeDisciplinaIds.add(codigo);

    upsertPortalDisciplina({
      codigo,
      nome: disciplina.nome,
    });

    upsertSyncedSemestreAtual({
      disciplina_id: codigo,
      local: disciplina.local,
      local_exibicao: null,
      horario_exibicao: null,
      professor_exibicao: null,
      horas_semanais_exibicao: null,
      grupo_nome: null,
      codigo_horario: disciplina.codigoHorario,
      horario_traduzido: disciplina.horarioTraduzido,
      cor: pickStablePaletteColor(codigo),
      apelido: suggestSubjectNickname(disciplina.nome, codigo),
      nome_exibicao: null,
      professor: null,
      max_faltas: null,
      nota_maxima: SUBJECT_DISPLAY_GRADE_MAX,
      nota_aprovacao: SUBJECT_DISPLAY_PASSING_GRADE,
      arquivos_baixados: 0,
      pdf_auto_download: 0,
    });
  }

  pruneSyncedSemestreAtual(Array.from(activeDisciplinaIds));

  for (const atividade of snapshot.atividades) {
    if (isAtividadePrazoVencido(atividade.dataFim, atividade.horaFim)) continue;

    const disciplinaId = resolveDisciplinaCodigoFromSemestre(
      atividade.disciplinaCodigo,
      semestreByNome,
      activeDisciplinaIds
    );
    if (!disciplinaId) continue;

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
      instrucoes:
        atividade.instrucoes && atividade.instrucoes.length > 0
          ? JSON.stringify(atividade.instrucoes)
          : null,
      entregaveis:
        atividade.entregaveis && atividade.entregaveis.length > 0
          ? JSON.stringify(atividade.entregaveis)
          : null,
      pontuacao_maxima: null,
    });
  }
}
