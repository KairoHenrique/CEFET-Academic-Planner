import { academicDates } from "@/config/mock/calendar";
import { getAttendanceByCode } from "@/config/mock/attendance";
import { integrationCategories } from "@/config/mock/integration";
import { semesterSubjects } from "@/config/mock/subjects";
import { academicTasks } from "@/config/mock/tasks";
import {
  clearSyncedStudentData,
  pruneSyncedSemestreAtual,
  saveAluno,
  saveCalendarioEvent,
  saveDisciplina,
  saveIntegralizacao,
  upsertSyncedFalta,
  upsertSyncedNota,
  upsertSyncedSemestreAtual,
  upsertSyncedTarefa,
} from "./queries";
import { seedPpcIfEmpty } from "./seed-ppc";
import { DEMO_SIGAA_CODIGO_HORARIO } from "@/lib/schedule/demo-sigaa-codigos";

const SEMESTRE_ATUAL = "2026.1";

function parseBrDateToIso(date: string): string {
  const [day, month, year] = date.split("/").map(Number);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseAcademicDateRange(label: string, date: string): {
  dataInicio: string;
  dataFim: string | null;
} {
  if (date.includes("–") || date.includes("-")) {
    const separator = date.includes("–") ? "–" : "-";
    const [startRaw, endRaw] = date.split(separator).map((part) => part.trim());
    const yearMatch = endRaw.match(/\d{4}/);
    const year = yearMatch?.[0] ?? "2026";
    const startParts = startRaw.split("/");
    const endParts = endRaw.replace(/\s*\d{4}/, "").trim().split("/");
    const dataInicio = parseBrDateToIso(`${startParts[0]}/${startParts[1]}/${year}`);
    const dataFim = parseBrDateToIso(`${endParts[0]}/${endParts[1]}/${year}`);
    return { dataInicio, dataFim };
  }

  return { dataInicio: parseBrDateToIso(date), dataFim: null };
}

export function seedDemoStudentData(): void {
  seedPpcIfEmpty();
  clearSyncedStudentData();

  saveAluno({
    matricula: "2024001234",
    nome: "Kairo",
    curso: "Engenharia de Computação",
    email: "kairo@aluno.cefetmg.br",
    semestre_entrada: "2024.1",
    rg: 56.33,
    status: "Regular",
  });

  const activeDisciplinaIds: string[] = [];

  for (const subject of semesterSubjects) {
    activeDisciplinaIds.push(subject.code);

    saveDisciplina({
      codigo: subject.code,
      nome: subject.name,
      tipo: "Obrigatória",
      carga_horaria: subject.ch ?? 60,
      periodo: null,
      ementa: subject.ementa,
    });

    upsertSyncedSemestreAtual({
      disciplina_id: subject.code,
      local: subject.room,
      local_exibicao: null,
      horario_exibicao: null,
      professor_exibicao: null,
      horas_semanais_exibicao: null,
      codigo_horario: DEMO_SIGAA_CODIGO_HORARIO[subject.code] ?? null,
      horario_traduzido: subject.schedule ?? null,
      cor: subject.color,
      apelido: null,
      nome_exibicao: null,
      professor: subject.professor ?? null,
      max_faltas: subject.maxAbsences,
      nota_maxima: subject.gradeMax,
      nota_aprovacao: subject.passingGrade,
      arquivos_baixados: subject.downloadedFiles,
      pdf_auto_download: subject.pdfAutoDownload ? 1 : 0,
    });

    for (const evaluation of subject.evaluations) {
      upsertSyncedNota({
        disciplina_id: subject.code,
        avaliacao_nome: evaluation.name,
        nota_maxima: evaluation.max,
        nota_obtida: evaluation.score,
        manual: evaluation.manual ? 1 : 0,
      });
    }

    const attendance = getAttendanceByCode(subject.code);
    for (const record of attendance.records) {
      upsertSyncedFalta({
        disciplina_id: subject.code,
        data: record.date,
        status: record.status,
      });
    }
  }

  pruneSyncedSemestreAtual(activeDisciplinaIds);

  for (const task of academicTasks) {
    upsertSyncedTarefa({
      disciplina_id: task.subjectCode,
      titulo: task.title,
      descricao: task.description,
      data_inicio: null,
      data_fim: parseBrDateToIso(task.date),
      hora_fim: task.dueTime ?? "23:59",
      tipo: task.type,
      possui_nota: task.hasGrade ? 1 : 0,
      concluida: task.done ? 1 : 0,
      manual: 0,
      instrucoes: JSON.stringify(task.instructions),
      entregaveis: JSON.stringify(task.deliverables),
      pontuacao_maxima: task.maxGrade ?? null,
    });
  }

  for (const category of integrationCategories) {
    saveIntegralizacao({
      tipo_ch: category.label,
      total_necessario: category.total,
      concluido: category.done,
      pendente: category.total - category.done,
      manual: 0,
    });
  }

  for (const academicDate of academicDates) {
    const { dataInicio, dataFim } = parseAcademicDateRange(
      academicDate.label,
      academicDate.date
    );
    saveCalendarioEvent({
      evento: academicDate.label,
      data_inicio: dataInicio,
      data_fim: dataFim,
      semestre: SEMESTRE_ATUAL,
    });
  }
}
