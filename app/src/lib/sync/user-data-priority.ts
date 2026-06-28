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
  row: Pick<SemestreAtualRow, "apelido" | "nome_exibicao">
): boolean {
  return Boolean(row.apelido?.trim() || row.nome_exibicao?.trim());
}

/** Campos do semestre que o usuário personaliza e o SIGAA não deve sobrescrever. */
export function mergeSemestreUserPreferences(
  incoming: SemestreAtualRow,
  existing?: SemestreAtualRow | null
): SemestreAtualRow {
  if (!existing) return incoming;

  return {
    ...incoming,
    apelido: existing.apelido,
    nome_exibicao: existing.nome_exibicao,
    cor: existing.cor ?? incoming.cor,
    pdf_auto_download: existing.pdf_auto_download ?? incoming.pdf_auto_download,
  };
}
