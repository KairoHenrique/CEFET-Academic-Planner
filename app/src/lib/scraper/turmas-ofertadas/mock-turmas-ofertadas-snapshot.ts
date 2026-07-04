import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import { offeredCourses } from "@/config/mock/enrollment";
import type { TurmasOfertadasSnapshot } from "@/lib/scraper/types/turmas-ofertadas";

const SIGAA_DAY_FROM_GRID = [2, 3, 4, 5, 6] as const;
const SIGAA_BLOCKS = ["M12", "M34", "M56", "T12", "T34", "N12", "N34"] as const;

export function buildMockTurmasOfertadasSnapshot(
  referenceDate = new Date()
): TurmasOfertadasSnapshot {
  const semestreAlvo = resolveNextAcademicSemesterLabel(referenceDate);

  return {
    scrapedAt: referenceDate.toISOString(),
    semestreAlvo,
    turmas: offeredCourses.map((course, index) => {
      const codigoHorario = course.slots
        .map(({ day, slot }) => {
          const sigaaDay = SIGAA_DAY_FROM_GRID[day] ?? 2;
          const block = SIGAA_BLOCKS[slot] ?? "M12";
          return `${sigaaDay}${block}`;
        })
        .join(" ");

      const pendente = index === 1;

      return {
        turmaSigaaId: `${semestreAlvo}:MOCK-${course.code}:${pendente ? "pendente" : "atendida"}`,
        sigaaComponente: `MOCK${course.code}`,
        codigoDisciplina: course.code,
        nome: course.name,
        turmaCodigo: "01",
        semestre: semestreAlvo,
        codigoHorario: pendente ? null : codigoHorario,
        horarioExibicao: pendente ? null : codigoHorario,
        local: course.room,
        professor: course.professor,
        vagas: 35,
        vagasOcupadas: 0,
        cargaHoraria: course.ch,
        situacao: pendente ? "pendente" : "atendida",
        tipoTurma: "Turma Regular",
        departamento: "DECOMDV - DEPARTAMENTO DE COMPUTAÇÃO",
        horarioIndefinido: pendente,
      };
    }),
  };
}
