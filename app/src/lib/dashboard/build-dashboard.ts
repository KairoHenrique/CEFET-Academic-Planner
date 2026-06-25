import { notFoundError } from "@/lib/api/errors";
import {
  countTarefasPendentesByDisciplina,
  countFaltasByDisciplina,
  getAluno,
  getIntegralizacao,
  getNotasByDisciplina,
  getSemestreAtual,
  getTarefas,
} from "@/lib/db/queries";
import type { DashboardResponse } from "@/lib/types/dashboard";
import type { IntegrationCategory } from "@/lib/types/integration";
import { INTEGRATION_TOTAL_HOURS } from "@/lib/types/integration";
import type { AcademicTask } from "@/lib/types/task";
import type { SubjectSummary } from "@/lib/types/subject";
import type { TarefaRow } from "@/lib/types/db";

const INTEGRATION_COLORS: Record<string, IntegrationCategory["color"]> = {
  Obrigatória: "blue",
  Optativa: "gold",
  Complementar: "success",
  Extensão: "warning",
  Flexibilizada: "blue",
};

function formatIsoToBr(iso: string | null): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function parseJsonArray(value: string | null): string[] {
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

function mapTarefaToAcademicTask(
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

function computeGrade(disciplinaId: string): number | null {
  const notas = getNotasByDisciplina(disciplinaId);
  if (notas.length === 0) return null;

  const hasScore = notas.some((nota) => nota.nota_obtida !== null);
  if (!hasScore) return null;

  const total = notas.reduce(
    (acc, nota) => acc + (nota.nota_obtida ?? 0),
    0
  );
  return Math.round(total * 10) / 10;
}

function buildSubjectSummaries(
  semestreRows: ReturnType<typeof getSemestreAtual>
): SubjectSummary[] {
  return semestreRows.map((semestre) => ({
    name: semestre.nome,
    code: semestre.disciplina_id,
    room: semestre.local ?? "—",
    grade: computeGrade(semestre.disciplina_id),
    gradeMax: semestre.nota_maxima ?? 100,
    absences: countFaltasByDisciplina(semestre.disciplina_id),
    maxAbsences: semestre.max_faltas ?? 15,
    tasks: countTarefasPendentesByDisciplina(semestre.disciplina_id),
    color: semestre.cor ?? "#3AA0E8",
  }));
}

export function buildDashboard(): DashboardResponse {
  const aluno = getAluno();
  if (!aluno) {
    throw notFoundError(
      "Nenhum dado sincronizado. Faça login e sincronize com o SIGAA."
    );
  }

  const semestreRows = getSemestreAtual();
  const disciplinas = buildSubjectSummaries(semestreRows);

  const integralizacaoRows = getIntegralizacao();
  const categories: IntegrationCategory[] = integralizacaoRows.map((row) => ({
    label: row.tipo_ch,
    done: row.concluido ?? 0,
    total: row.total_necessario ?? 0,
    color: INTEGRATION_COLORS[row.tipo_ch] ?? "blue",
  }));

  const totalDone = categories.reduce((acc, item) => acc + item.done, 0);
  const integralizacaoPercent = Math.round(
    (totalDone / INTEGRATION_TOTAL_HOURS) * 100
  );

  const tarefasDb = getTarefas();
  const colorByCode = new Map(
    semestreRows.map((row) => [row.disciplina_id, row.cor ?? "#3AA0E8"])
  );
  const nameByCode = new Map(
    semestreRows.map((row) => [row.disciplina_id, row.nome])
  );

  const tarefas: AcademicTask[] = tarefasDb
    .map((row) =>
      mapTarefaToAcademicTask(
        { ...row, disciplina_nome: nameByCode.get(row.disciplina_id) },
        colorByCode.get(row.disciplina_id) ?? "#3AA0E8"
      )
    )
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return a.date.localeCompare(b.date);
    });

  const tarefasPendentes = tarefas.filter((task) => !task.done).length;

  return {
    aluno: {
      matricula: aluno.matricula,
      nome: aluno.nome,
      curso: aluno.curso ?? "",
      email: aluno.email ?? "",
      semestreAtual: "2026.1",
      rg: aluno.rg ?? 0,
      status: aluno.status ?? "",
    },
    stats: {
      rg: aluno.rg ?? 0,
      integralizacaoPercent,
      disciplinasCursando: disciplinas.length,
      tarefasPendentes,
    },
    integralizacao: {
      totalHours: INTEGRATION_TOTAL_HOURS,
      totalDone,
      categories,
    },
    tarefas,
    disciplinas,
  };
}
