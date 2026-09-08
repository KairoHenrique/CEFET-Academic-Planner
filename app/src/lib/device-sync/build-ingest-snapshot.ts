import { pickStablePaletteColor } from "@/lib/colors/palette";
import {
  SUBJECT_DISPLAY_GRADE_MAX,
  SUBJECT_DISPLAY_PASSING_GRADE,
} from "@/lib/disciplinas/grade-display";
import { resolveDisciplinaCodigoForPortal } from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";
import type { PortalDiscenteSnapshot } from "@/lib/scraper/types/portal-discente";
import type { UserSqliteSnapshot } from "@/lib/sync-mirror/read-sqlite-snapshot";
import { isAtividadePrazoVencido } from "@/lib/tasks/dates";

/**
 * Converte snapshot do portal (HTTP) no shape de ingest/mirror.
 * MVP R1 lite: aluno + semestre + tarefas do portal + integralização.
 * Notas/faltas/histórico/grupo ficam vazios até o adapter TV (pós-MVP).
 */
export function buildIngestSnapshotFromPortal(
  portal: PortalDiscenteSnapshot
): UserSqliteSnapshot {
  const syncedAt = new Date().toISOString();
  const disciplinas = portal.semestreAtual.map((disciplina) => {
    const codigo = resolveDisciplinaCodigoForPortal(
      disciplina.codigo,
      disciplina.nome
    );
    return {
      codigo,
      nome: disciplina.nome,
      tipo: null as string | null,
      carga_horaria: null as number | null,
      periodo: null as number | null,
      ementa: null as string | null,
    };
  });

  const semestreAtual = portal.semestreAtual.map((disciplina, index) => {
    const codigo = resolveDisciplinaCodigoForPortal(
      disciplina.codigo,
      disciplina.nome
    );
    return {
      disciplina_id: codigo,
      local: disciplina.local,
      codigo_horario: disciplina.codigoHorario,
      horario_traduzido: disciplina.horarioTraduzido,
      cor: pickStablePaletteColor(codigo || String(index)),
      apelido: null as string | null,
      nome_exibicao: null as string | null,
      local_exibicao: null as string | null,
      horario_exibicao: null as string | null,
      professor_exibicao: null as string | null,
      horas_semanais_exibicao: null as number | null,
      grupo_nome: null as string | null,
      professor: null as string | null,
      max_faltas: null as number | null,
      nota_maxima: SUBJECT_DISPLAY_GRADE_MAX,
      nota_aprovacao: SUBJECT_DISPLAY_PASSING_GRADE,
      arquivos_baixados: null as number | null,
      pdf_auto_download: null as number | null,
      turma_data_inicio: disciplina.turmaDataInicio ?? null,
      turma_data_fim: disciplina.turmaDataFim ?? null,
    };
  });

  const tarefasSynced = portal.atividades.map((atividade) => {
    const disciplinaId = resolveDisciplinaCodigoForPortal(
      atividade.disciplinaCodigo,
      atividade.disciplinaCodigo
    );
    const vencida = isAtividadePrazoVencido(
      atividade.dataFim,
      atividade.horaFim
    );
    return {
      id: 0,
      disciplina_id: disciplinaId,
      titulo: atividade.titulo,
      descricao: atividade.descricao,
      data_inicio: null as string | null,
      data_fim: atividade.dataFim,
      hora_fim: atividade.horaFim,
      tipo: atividade.tipo,
      possui_nota: 0,
      concluida: atividade.enviada || vencida ? 1 : 0,
      manual: 0,
      instrucoes: atividade.instrucoes
        ? JSON.stringify(atividade.instrucoes)
        : null,
      entregaveis: atividade.entregaveis
        ? JSON.stringify(atividade.entregaveis)
        : null,
      pontuacao_maxima: null as number | null,
      sigaa_link_id: atividade.linkId ?? null,
    };
  });

  const integralizacaoSynced = portal.integralizacao.map((item) => ({
    tipo_ch: item.tipoCh,
    total_necessario: item.totalNecessario,
    concluido: item.concluido,
    pendente: item.pendente,
    manual: 0,
  }));

  const config: Array<{ chave: string; valor: string }> = [
    { chave: "sync.last_at", valor: syncedAt },
  ];
  if (portal.integralizacaoResumo.totalCurriculo != null) {
    config.push({
      chave: "sigaa.ch.total_curriculo",
      valor: String(portal.integralizacaoResumo.totalCurriculo),
    });
  }
  if (portal.integralizacaoResumo.percentIntegralizado != null) {
    config.push({
      chave: "sigaa.ch.percent_integralizado",
      valor: String(portal.integralizacaoResumo.percentIntegralizado),
    });
  }

  return {
    aluno: {
      matricula: portal.aluno.matricula,
      nome: portal.aluno.nome,
      curso: portal.aluno.curso,
      email: portal.aluno.email,
      semestre_entrada: portal.aluno.semestreEntrada,
      rg: portal.aluno.rg,
      status: portal.aluno.status,
    },
    disciplinas,
    requisitos: [],
    historico: [],
    semestreAtual,
    notasSynced: [],
    faltasSynced: [],
    tarefasSynced,
    grupoMembros: [],
    integralizacaoSynced,
    config,
  };
}
