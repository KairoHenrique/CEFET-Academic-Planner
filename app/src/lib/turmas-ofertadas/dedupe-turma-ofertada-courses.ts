import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";
import { extractHorarioCodigoFromText } from "@/lib/schedule/parse-sigaa-codigo";

function normalizeHorarioFingerprint(
  codigoHorario: string | null,
  slots: TurmaOfertadaCourse["slots"]
): string {
  const fromCodigo = codigoHorario?.trim().toUpperCase().replace(/\s+/g, "-");
  if (fromCodigo) return fromCodigo;

  const fromText = extractHorarioCodigoFromText(codigoHorario ?? "");
  if (fromText) return fromText.replace(/\s+/g, "-");

  if (slots.length > 0) {
    return slots
      .map((slot) => `${slot.day}:${slot.slot}`)
      .sort()
      .join("+");
  }

  return "sem-horario";
}

/** Mesma disciplina + horário no semestre = mesma turma lógica (mesmo com turma_sigaa_id diferente). */
export function buildTurmaCourseFingerprint(
  course: Pick<
    TurmaOfertadaCourse,
    "semestre" | "code" | "codigoHorario" | "slots"
  >
): string {
  return [
    course.semestre,
    course.code.trim().toUpperCase(),
    normalizeHorarioFingerprint(course.codigoHorario, course.slots),
  ].join("|");
}

function pickRicherTurmaCourse(
  current: TurmaOfertadaCourse,
  candidate: TurmaOfertadaCourse
): TurmaOfertadaCourse {
  if (candidate.situacao === "atendida" && current.situacao !== "atendida") {
    return candidate;
  }
  if (current.situacao === "atendida" && candidate.situacao !== "atendida") {
    return current;
  }

  if (!candidate.scheduleBlocker && current.scheduleBlocker) return candidate;
  if (candidate.scheduleBlocker && !current.scheduleBlocker) return current;

  const currentVagas = current.vagas ?? -1;
  const candidateVagas = candidate.vagas ?? -1;
  if (candidateVagas > currentVagas) return candidate;

  return current;
}

export function dedupeTurmaOfertadaCourses(
  courses: TurmaOfertadaCourse[]
): TurmaOfertadaCourse[] {
  const unique = new Map<string, TurmaOfertadaCourse>();

  for (const course of courses) {
    const fingerprint = buildTurmaCourseFingerprint(course);
    const existing = unique.get(fingerprint);
    unique.set(
      fingerprint,
      existing ? pickRicherTurmaCourse(existing, course) : course
    );
  }

  return Array.from(unique.values());
}
