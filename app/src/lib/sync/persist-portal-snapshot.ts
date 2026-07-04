import { pickStablePaletteColor } from "@/lib/colors/palette";
import { attachUniqueShortLabels } from "@/lib/disciplinas/attach-unique-short-labels";
import { buildExtraNicknameWordsByCode } from "@/lib/disciplinas/subject-nickname-enrichment";
import { suggestSubjectNickname } from "@/lib/disciplinas/subject-display-name";
import {
  SUBJECT_DISPLAY_GRADE_MAX,
  SUBJECT_DISPLAY_PASSING_GRADE,
} from "@/lib/disciplinas/grade-display";
import {
  normalizeDisciplinaNome,
  resolveDisciplinaCodigoForPortal,
  resolveDisciplinaCodigoFromSemestre,
} from "@/lib/scraper/portal-discente/resolve-disciplina-codigo";
import {
  clearPortalSyncedData,
  getTarefas,
  pruneSyncedSemestreAtual,
  saveAluno,
  upsertPortalDisciplina,
  upsertSyncedIntegralizacao,
  upsertSyncedSemestreAtual,
  upsertSyncedTarefa,
} from "@/lib/db/queries";
import { normalizeDisciplinaCode } from "@/lib/mapa/course-status";
import { persistSigaaIntegralizacaoResumo } from "@/lib/integralizacao/sigaa-ch-config";
import { seedPpcIfEmpty } from "@/lib/db/seed-ppc";
import { isAtividadePrazoVencido } from "@/lib/tasks/dates";
import { ensureStudentSyncIsolation } from "@/lib/sync/student-isolation";
import type { PortalDiscenteSnapshot } from "@/lib/scraper/types/portal-discente";
import { isPortalSnapshotPersistable } from "@/lib/sync/portal-snapshot-policy";

export interface PersistPortalResult {
  persisted: boolean;
  reason?: string;
}

interface SyncedTarefaContent {
  descricao: string | null;
  instrucoes: string | null;
  entregaveis: string | null;
}

function tarefaContentCacheKey(disciplinaId: string, titulo: string): string {
  return `${disciplinaId.toLowerCase()}\0${titulo.toLowerCase()}`;
}

function buildSyncedTarefaContentCache(): Map<string, SyncedTarefaContent> {
  const cache = new Map<string, SyncedTarefaContent>();

  for (const tarefa of getTarefas()) {
    if (tarefa.manual === 1) continue;
    cache.set(tarefaContentCacheKey(tarefa.disciplina_id, tarefa.titulo), {
      descricao: tarefa.descricao,
      instrucoes: tarefa.instrucoes,
      entregaveis: tarefa.entregaveis,
    });
  }

  return cache;
}

function resolveAtividadeInstrucoes(
  atividade: PortalDiscenteSnapshot["atividades"][number],
  preserved: SyncedTarefaContent | undefined
): string | null {
  if (atividade.enviada && preserved?.instrucoes) return preserved.instrucoes;
  if (atividade.instrucoes && atividade.instrucoes.length > 0) {
    return JSON.stringify(atividade.instrucoes);
  }
  return preserved?.instrucoes ?? null;
}

function resolveAtividadeEntregaveis(
  atividade: PortalDiscenteSnapshot["atividades"][number],
  preserved: SyncedTarefaContent | undefined
): string | null {
  if (atividade.enviada && preserved?.entregaveis) return preserved.entregaveis;
  if (atividade.entregaveis && atividade.entregaveis.length > 0) {
    return JSON.stringify(atividade.entregaveis);
  }
  return preserved?.entregaveis ?? null;
}

function buildSemestreCodigoByNome(
  snapshot: PortalDiscenteSnapshot
): Map<string, string> {
  const map = new Map<string, string>();

  for (const disciplina of snapshot.semestreAtual) {
    const codigo = resolveDisciplinaCodigoForPortal(
      disciplina.codigo,
      disciplina.nome
    );
    map.set(normalizeDisciplinaNome(disciplina.nome), codigo);
  }

  return map;
}

export async function persistPortalSnapshot(
  snapshot: PortalDiscenteSnapshot
): Promise<PersistPortalResult> {
  if (!isPortalSnapshotPersistable(snapshot)) {
    return {
      persisted: false,
      reason: "Snapshot do portal vazio ou sem matrícula.",
    };
  }

  ensureStudentSyncIsolation(snapshot.aluno.matricula);
  seedPpcIfEmpty();
  const tarefaContentCache = buildSyncedTarefaContentCache();
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

  persistSigaaIntegralizacaoResumo({
    ...snapshot.integralizacaoResumo,
    fromHistoricoPdf: false,
  });

  const activeDisciplinaIds = new Set<string>();
  const semestreByNome = buildSemestreCodigoByNome(snapshot);
  const apelidoEntries = snapshot.semestreAtual.map((disciplina) => ({
    code: resolveDisciplinaCodigoForPortal(disciplina.codigo, disciplina.nome),
    name: disciplina.nome,
  }));
  const extraWordsByCode = await buildExtraNicknameWordsByCode(apelidoEntries);
  const apelidoRegistry = new Map(
    attachUniqueShortLabels(apelidoEntries, extraWordsByCode).map((entry) => [
      normalizeDisciplinaCode(entry.code),
      entry.shortLabel,
    ])
  );

  for (const disciplina of snapshot.semestreAtual) {
    const codigo = resolveDisciplinaCodigoForPortal(
      disciplina.codigo,
      disciplina.nome
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
      turma_data_inicio: disciplina.turmaDataInicio ?? null,
      turma_data_fim: disciplina.turmaDataFim ?? null,
      cor: pickStablePaletteColor(codigo),
      apelido:
        apelidoRegistry.get(normalizeDisciplinaCode(codigo)) ??
        suggestSubjectNickname(disciplina.nome, codigo),
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

    const preserved = tarefaContentCache.get(
      tarefaContentCacheKey(disciplinaId, atividade.titulo)
    );

    upsertSyncedTarefa({
      disciplina_id: disciplinaId,
      titulo: atividade.titulo,
      descricao:
        atividade.enviada && preserved?.descricao
          ? preserved.descricao
          : atividade.descricao ?? preserved?.descricao ?? null,
      data_inicio: null,
      data_fim: atividade.dataFim,
      hora_fim: atividade.horaFim ?? "23:59",
      tipo: atividade.tipo,
      possui_nota: 0,
      concluida: atividade.enviada ? 1 : 0,
      manual: 0,
      instrucoes: resolveAtividadeInstrucoes(atividade, preserved),
      entregaveis: resolveAtividadeEntregaveis(atividade, preserved),
      pontuacao_maxima: null,
    });
  }

  return { persisted: true };
}
