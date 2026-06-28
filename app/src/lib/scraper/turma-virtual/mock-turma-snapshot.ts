import { getAttendanceByCode } from "@/config/mock/attendance";
import { semesterSubjects } from "@/config/mock/subjects";
import { academicTasks } from "@/config/mock/tasks";
import type {
  TurmaVirtualDisciplinaSnapshot,
  TurmaVirtualSnapshot,
} from "@/lib/scraper/types/turma-virtual";

const MOCK_GRUPO: Record<
  string,
  Array<{ nome: string; matricula: string; email: string; curso: string }>
> = {
  "ENG-SOFT": [
    {
      nome: "Kairo Henrique",
      matricula: "2024001234",
      email: "kairo@aluno.cefetmg.br",
      curso: "Eng. Computação",
    },
    {
      nome: "Maria Silva",
      matricula: "2024005678",
      email: "maria@aluno.cefetmg.br",
      curso: "Eng. Computação",
    },
  ],
};

function parseBrDateToIso(date: string): string {
  const [day, month, year] = date.split("/").map(Number);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildDisciplinaSnapshot(
  subject: (typeof semesterSubjects)[number]
): TurmaVirtualDisciplinaSnapshot {
  const attendance = getAttendanceByCode(subject.code);
  const tasks = academicTasks.filter((task) => task.subjectCode === subject.code);
  const grupo = MOCK_GRUPO[subject.code] ?? [];

  return {
    sigaaNome: subject.name,
    sigaaUrl: `https://sig.cefetmg.br/sigaa/ava/mock/${subject.code}`,
    professor: subject.professor ?? null,
    maxFaltas: subject.maxAbsences,
    notas: subject.evaluations.map((evaluation) => ({
      avaliacaoNome: evaluation.name,
      notaMaxima: evaluation.max,
      notaObtida: evaluation.score,
    })),
    faltas: attendance.records.map((record) => ({
      data: record.date,
      status: record.status,
    })),
    grupo: grupo.map((membro) => ({
      nome: membro.nome,
      matricula: membro.matricula,
      email: membro.email,
      curso: membro.curso,
    })),
    tarefas: tasks.map((task) => ({
      titulo: task.title,
      descricao: task.description ?? null,
      dataInicio: null,
      dataFim: parseBrDateToIso(task.date),
      horaFim: task.dueTime ?? "23:59",
      tipo: task.type,
      possuiNota: task.hasGrade,
      pontuacaoMaxima: task.maxGrade ?? null,
      instrucoes: [...task.instructions],
      entregaveis: [...task.deliverables],
      downloadUrls: [],
    })),
    scrapeWarnings: [],
  };
}

export function buildMockTurmaVirtualSnapshot(): TurmaVirtualSnapshot {
  return {
    scrapedAt: new Date().toISOString(),
    disciplinas: semesterSubjects.map(buildDisciplinaSnapshot),
  };
}
