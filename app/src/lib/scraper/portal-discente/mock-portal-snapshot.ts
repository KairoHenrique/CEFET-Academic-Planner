import { integrationCategories } from "@/config/mock/integration";
import { semesterSubjects } from "@/config/mock/subjects";
import { academicTasks } from "@/config/mock/tasks";
import { DEMO_SIGAA_CODIGO_HORARIO } from "@/lib/schedule/demo-sigaa-codigos";
import type { PortalDiscenteSnapshot } from "@/lib/scraper/types/portal-discente";

function parseBrDateToIso(date: string): string {
  const [day, month, year] = date.split("/").map(Number);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function buildMockPortalSnapshot(username: string): PortalDiscenteSnapshot {
  return {
    scrapedAt: new Date().toISOString(),
    aluno: {
      matricula: "2024001234",
      nome: username === "12345678901" ? "Kairo" : "Discente Demo",
      curso: "Engenharia de Computação",
      email: "kairo@aluno.cefetmg.br",
      semestreEntrada: "2024.1",
      rg: 56.33,
      status: "Regular",
    },
    integralizacao: integrationCategories.map((category) => ({
      tipoCh: category.label,
      concluido: category.done,
      pendente: category.total - category.done,
      totalNecessario: category.total,
    })),
    integralizacaoResumo: {
      totalCurriculo: 4320,
      percentIntegralizado: 16,
    },
    semestreAtual: semesterSubjects.map((subject) => ({
      codigo: subject.code,
      nome: subject.name,
      local: subject.room ?? null,
      codigoHorario: DEMO_SIGAA_CODIGO_HORARIO[subject.code] ?? null,
      horarioTraduzido: subject.schedule ?? null,
    })),
    semestreLetivo: "2026.1",
    atividades: academicTasks
      .filter((task) => !task.done)
      .map((task) => ({
        disciplinaCodigo: task.subjectCode,
        titulo: task.title,
        dataFim: parseBrDateToIso(task.date),
        horaFim: task.dueTime ?? "23:59",
        tipo: task.type,
        descricao: task.description ?? null,
      })),
  };
}
