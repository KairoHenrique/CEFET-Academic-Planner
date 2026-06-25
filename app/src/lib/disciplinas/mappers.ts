import type { TarefaRow, NotaRow } from "@/lib/types/db";
import type { AcademicTask } from "@/lib/types/task";
import type { SubjectEvaluation } from "@/lib/types/subject";
import type { GrupoMembroDto } from "@/lib/types/disciplinas-api";
import type { GrupoMembroRow } from "@/lib/types/db";

export function formatIsoToBr(iso: string | null): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function mapNotasToEvaluations(notas: NotaRow[]): SubjectEvaluation[] {
  return notas.map((nota) => ({
    id: nota.id,
    name: nota.avaliacao_nome,
    max: nota.nota_maxima ?? 0,
    score: nota.nota_obtida,
    manual: nota.manual === 1,
  }));
}

export function mapTarefaToAcademicTask(
  row: TarefaRow & { disciplina_nome?: string },
  subjectColor: string
): AcademicTask {
  return {
    id: row.id,
    title: row.titulo,
    subject: row.disciplina_nome ?? row.disciplina_id,
    subjectCode: row.disciplina_id,
    subjectColor,
    date: formatIsoToBr(row.data_fim),
    type: row.tipo ?? "individual",
    done: row.concluida === 1,
    description: row.descricao ?? "",
    instructions: parseJsonArray(row.instrucoes),
    deliverables: parseJsonArray(row.entregaveis),
    hasGrade: row.possui_nota === 1,
    maxGrade: row.pontuacao_maxima ?? undefined,
  };
}

export function mapGrupoMembros(rows: GrupoMembroRow[]): GrupoMembroDto[] {
  return rows.map((row) => ({
    nome: row.nome,
    matricula: row.matricula,
    email: row.email,
    curso: row.curso,
  }));
}
