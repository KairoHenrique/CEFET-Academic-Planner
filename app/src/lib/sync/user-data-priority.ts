import type {
  FaltaRow,
  IntegralizacaoRow,
  NotaRow,
  SemestreAtualRow,
  TarefaRow,
} from "@/lib/types/db";

/**
 * Regra de negócio #1 do produto:
 * dados inseridos ou editados pelo usuário têm prioridade absoluta.
 * O sync do SIGAA só preenche lacunas e atualiza registros ainda "puros".
 */

export function isNotaProtectedByUser(nota: NotaRow): boolean {
  return nota.manual === 1 || (nota.nota_override ?? 0) === 1;
}

export function isFaltaProtectedByUser(falta: FaltaRow): boolean {
  return (falta.status_override ?? 0) === 1 || falta.manual === 1;
}

export function isTarefaProtectedByUser(tarefa: TarefaRow): boolean {
  return tarefa.manual === 1 || (tarefa.concluida_override ?? 0) === 1;
}

export function isIntegralizacaoProtectedByUser(row: IntegralizacaoRow): boolean {
  return row.manual === 1;
}

export function hasUserSemestrePreferences(
  row: Pick<SemestreAtualRow, "nome_exibicao">
): boolean {
  // Apelido/cor são definidos pelo sync — só nome_exibicao é edição explícita do usuário.
  return Boolean(row.nome_exibicao?.trim());
}

/** Campos do semestre que o usuário personaliza e o SIGAA não deve sobrescrever. */
export function mergeSemestreUserPreferences(
  incoming: SemestreAtualRow,
  existing?: SemestreAtualRow | null
): SemestreAtualRow {
  if (!existing) return incoming;

  return {
    ...incoming,
    apelido: existing.apelido?.trim() ? existing.apelido : incoming.apelido,
    nome_exibicao: existing.nome_exibicao?.trim()
      ? existing.nome_exibicao
      : incoming.nome_exibicao,
    cor: existing.cor ?? incoming.cor,
    local_exibicao: existing.local_exibicao?.trim()
      ? existing.local_exibicao
      : incoming.local_exibicao,
    horario_exibicao: existing.horario_exibicao?.trim()
      ? existing.horario_exibicao
      : incoming.horario_exibicao,
    professor_exibicao: existing.professor_exibicao?.trim()
      ? existing.professor_exibicao
      : incoming.professor_exibicao,
    horas_semanais_exibicao:
      existing.horas_semanais_exibicao != null && existing.horas_semanais_exibicao > 0
        ? existing.horas_semanais_exibicao
        : incoming.horas_semanais_exibicao,
    pdf_auto_download: existing.pdf_auto_download ?? incoming.pdf_auto_download,
  };
}
