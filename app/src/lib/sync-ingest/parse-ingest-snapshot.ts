import { validationError } from "@/lib/api/errors";
import { MIRROR_CONFIG_KEYS } from "@/lib/sync-mirror/read-sqlite-snapshot";
import type { UserSqliteSnapshot } from "@/lib/sync-mirror/read-sqlite-snapshot";
import type {
  AlunoRow,
  DisciplinaRow,
  FaltaRow,
  GrupoMembroRow,
  HistoricoRow,
  IntegralizacaoRow,
  NotaRow,
  RequisitoRow,
  SemestreAtualRow,
  TarefaRow,
} from "@/lib/types/db";

const MAX_PAYLOAD_CHARS = 2_500_000;
const ALLOWED_CONFIG = new Set<string>(MIRROR_CONFIG_KEYS);

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validationError(`${label} inválido.`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw validationError(`${label} deve ser um array.`);
  }
  return value;
}

function parseAluno(raw: unknown): AlunoRow | undefined {
  if (raw == null) return undefined;
  const row = asRecord(raw, "aluno");
  const matricula = asString(row.matricula)?.trim();
  const nome = asString(row.nome)?.trim();
  if (!matricula || !nome) {
    throw validationError("aluno.matricula e aluno.nome são obrigatórios.");
  }
  return {
    matricula,
    nome,
    curso: asString(row.curso),
    email: asString(row.email),
    semestre_entrada: asString(row.semestre_entrada),
    rg: asNumber(row.rg),
    status: asString(row.status),
    refeicoes_disponiveis: asNumber(row.refeicoes_disponiveis),
    ru_synced_at: asString(row.ru_synced_at),
  };
}

function parseDisciplinas(raw: unknown): DisciplinaRow[] {
  return asArray(raw ?? [], "disciplinas").map((item, index) => {
    const row = asRecord(item, `disciplinas[${index}]`);
    const codigo = asString(row.codigo)?.trim();
    const nome = asString(row.nome)?.trim();
    if (!codigo || !nome) {
      throw validationError(`disciplinas[${index}] inválida.`);
    }
    return {
      codigo,
      nome,
      tipo: asString(row.tipo),
      carga_horaria: asNumber(row.carga_horaria),
      periodo: asNumber(row.periodo),
      ementa: asString(row.ementa),
    };
  });
}

function parseSemestreAtual(raw: unknown): SemestreAtualRow[] {
  return asArray(raw ?? [], "semestreAtual").map((item, index) => {
    const row = asRecord(item, `semestreAtual[${index}]`);
    const disciplinaId = asString(row.disciplina_id)?.trim();
    if (!disciplinaId) {
      throw validationError(`semestreAtual[${index}].disciplina_id obrigatório.`);
    }
    return {
      disciplina_id: disciplinaId,
      local: asString(row.local),
      codigo_horario: asString(row.codigo_horario),
      horario_traduzido: asString(row.horario_traduzido),
      cor: asString(row.cor),
      apelido: asString(row.apelido),
      nome_exibicao: asString(row.nome_exibicao),
      local_exibicao: asString(row.local_exibicao),
      horario_exibicao: asString(row.horario_exibicao),
      professor_exibicao: asString(row.professor_exibicao),
      horas_semanais_exibicao: asNumber(row.horas_semanais_exibicao),
      grupo_nome: asString(row.grupo_nome),
      professor: asString(row.professor),
      max_faltas: asNumber(row.max_faltas),
      nota_maxima: asNumber(row.nota_maxima),
      nota_aprovacao: asNumber(row.nota_aprovacao),
      arquivos_baixados: asNumber(row.arquivos_baixados),
      pdf_auto_download: asNumber(row.pdf_auto_download),
      turma_data_inicio: asString(row.turma_data_inicio),
      turma_data_fim: asString(row.turma_data_fim),
    };
  });
}

function parseNotas(raw: unknown): NotaRow[] {
  return asArray(raw ?? [], "notasSynced").map((item, index) => {
    const row = asRecord(item, `notasSynced[${index}]`);
    const disciplinaId = asString(row.disciplina_id)?.trim();
    const avaliacao = asString(row.avaliacao_nome)?.trim();
    if (!disciplinaId || !avaliacao) {
      throw validationError(`notasSynced[${index}] inválida.`);
    }
    return {
      id: asNumber(row.id) ?? 0,
      disciplina_id: disciplinaId,
      avaliacao_nome: avaliacao,
      nota_maxima: asNumber(row.nota_maxima),
      nota_obtida: asNumber(row.nota_obtida),
      manual: 0,
      nota_override: asNumber(row.nota_override) ?? undefined,
      nota_extra: asNumber(row.nota_extra) ?? undefined,
    };
  });
}

function parseFaltas(raw: unknown): FaltaRow[] {
  return asArray(raw ?? [], "faltasSynced").map((item, index) => {
    const row = asRecord(item, `faltasSynced[${index}]`);
    const disciplinaId = asString(row.disciplina_id)?.trim();
    const data = asString(row.data)?.trim();
    const status = asString(row.status);
    if (
      !disciplinaId ||
      !data ||
      (status !== "presente" &&
        status !== "falta" &&
        status !== "nao_registrada")
    ) {
      throw validationError(`faltasSynced[${index}] inválida.`);
    }
    return {
      id: asNumber(row.id) ?? 0,
      disciplina_id: disciplinaId,
      data,
      status,
      quantidade: asNumber(row.quantidade) ?? undefined,
      manual: 0,
    };
  });
}

function parseTarefas(raw: unknown): TarefaRow[] {
  return asArray(raw ?? [], "tarefasSynced").map((item, index) => {
    const row = asRecord(item, `tarefasSynced[${index}]`);
    const disciplinaId = asString(row.disciplina_id)?.trim();
    const titulo = asString(row.titulo)?.trim();
    if (!disciplinaId || !titulo) {
      throw validationError(`tarefasSynced[${index}] inválida.`);
    }
    const tipoRaw = asString(row.tipo);
    const tipo =
      tipoRaw === "individual" || tipoRaw === "grupo" ? tipoRaw : null;
    return {
      id: asNumber(row.id) ?? 0,
      disciplina_id: disciplinaId,
      titulo,
      descricao: asString(row.descricao),
      data_inicio: asString(row.data_inicio),
      data_fim: asString(row.data_fim),
      hora_fim: asString(row.hora_fim),
      tipo,
      possui_nota: asNumber(row.possui_nota) ?? 0,
      concluida: asNumber(row.concluida) ?? 0,
      manual: 0,
      instrucoes: asString(row.instrucoes),
      entregaveis: asString(row.entregaveis),
      pontuacao_maxima: asNumber(row.pontuacao_maxima),
      sigaa_link_id: asString(row.sigaa_link_id) ?? undefined,
    };
  });
}

function parseHistorico(raw: unknown): Array<Omit<HistoricoRow, "id">> {
  return asArray(raw ?? [], "historico").map((item, index) => {
    const row = asRecord(item, `historico[${index}]`);
    const disciplinaId = asString(row.disciplina_id)?.trim();
    const semestre = asString(row.semestre)?.trim();
    if (!disciplinaId || !semestre) {
      throw validationError(`historico[${index}] inválido.`);
    }
    return {
      disciplina_id: disciplinaId,
      semestre,
      status: asString(row.status),
      nota_final: asNumber(row.nota_final),
    };
  });
}

function parseRequisitos(raw: unknown): RequisitoRow[] {
  return asArray(raw ?? [], "requisitos").map((item, index) => {
    const row = asRecord(item, `requisitos[${index}]`);
    const disciplinaId = asString(row.disciplina_id)?.trim();
    const requisitoId = asString(row.requisito_id)?.trim();
    const tipo = asString(row.tipo);
    if (
      !disciplinaId ||
      !requisitoId ||
      (tipo !== "pre" && tipo !== "co")
    ) {
      throw validationError(`requisitos[${index}] inválido.`);
    }
    return {
      disciplina_id: disciplinaId,
      requisito_id: requisitoId,
      tipo,
    };
  });
}

function parseGrupo(raw: unknown): Array<Omit<GrupoMembroRow, "id">> {
  return asArray(raw ?? [], "grupoMembros").map((item, index) => {
    const row = asRecord(item, `grupoMembros[${index}]`);
    const disciplinaId = asString(row.disciplina_id)?.trim();
    const nome = asString(row.nome)?.trim();
    if (!disciplinaId || !nome) {
      throw validationError(`grupoMembros[${index}] inválido.`);
    }
    return {
      disciplina_id: disciplinaId,
      nome,
      matricula: asString(row.matricula),
      email: asString(row.email),
      curso: asString(row.curso),
    };
  });
}

function parseIntegralizacao(
  raw: unknown
): Array<Omit<IntegralizacaoRow, "id">> {
  return asArray(raw ?? [], "integralizacaoSynced").map((item, index) => {
    const row = asRecord(item, `integralizacaoSynced[${index}]`);
    const tipoCh = asString(row.tipo_ch)?.trim();
    if (!tipoCh) {
      throw validationError(`integralizacaoSynced[${index}] inválida.`);
    }
    return {
      tipo_ch: tipoCh,
      total_necessario: asNumber(row.total_necessario),
      concluido: asNumber(row.concluido),
      pendente: asNumber(row.pendente),
      manual: 0,
    };
  });
}

function parseConfig(
  raw: unknown
): Array<{ chave: string; valor: string }> {
  return asArray(raw ?? [], "config")
    .map((item, index) => {
      const row = asRecord(item, `config[${index}]`);
      const chave = asString(row.chave)?.trim();
      const valor = asString(row.valor);
      if (!chave || valor == null) {
        throw validationError(`config[${index}] inválida.`);
      }
      return { chave, valor };
    })
    .filter((entry) => ALLOWED_CONFIG.has(entry.chave));
}

/**
 * Valida o body de `POST /api/sync/ingest` (sem senha SIGAA).
 * Aceita o mesmo shape do snapshot de mirror (`UserSqliteSnapshot`).
 */
export function parseIngestSnapshotBody(body: unknown): {
  source: "device";
  snapshot: UserSqliteSnapshot;
} {
  if (typeof body === "string" && body.length > MAX_PAYLOAD_CHARS) {
    throw validationError("Payload de sync muito grande.");
  }

  const record = asRecord(body, "body");
  if (record.password != null || record.passwordEnc != null) {
    throw validationError(
      "Não envie senha SIGAA no ingest — apenas o snapshot raspado."
    );
  }

  const serialized = JSON.stringify(record);
  if (serialized.length > MAX_PAYLOAD_CHARS) {
    throw validationError("Payload de sync muito grande.");
  }

  const snapshotRaw = asRecord(record.snapshot ?? record, "snapshot");
  const source = record.source === "device" ? "device" : "device";

  const snapshot: UserSqliteSnapshot = {
    aluno: parseAluno(snapshotRaw.aluno),
    disciplinas: parseDisciplinas(snapshotRaw.disciplinas),
    requisitos: parseRequisitos(snapshotRaw.requisitos),
    historico: parseHistorico(snapshotRaw.historico),
    semestreAtual: parseSemestreAtual(snapshotRaw.semestreAtual),
    notasSynced: parseNotas(snapshotRaw.notasSynced),
    faltasSynced: parseFaltas(snapshotRaw.faltasSynced),
    tarefasSynced: parseTarefas(snapshotRaw.tarefasSynced),
    grupoMembros: parseGrupo(snapshotRaw.grupoMembros),
    integralizacaoSynced: parseIntegralizacao(
      snapshotRaw.integralizacaoSynced
    ),
    config: parseConfig(snapshotRaw.config),
  };

  if (!snapshot.aluno) {
    throw validationError("Snapshot sem dados do aluno.");
  }

  return { source, snapshot };
}
