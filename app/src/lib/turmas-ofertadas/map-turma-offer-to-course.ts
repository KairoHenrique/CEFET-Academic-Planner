import { normalizeCefetCh } from "@/lib/disciplinas/cefet-ch";
import { normalizeDisciplinaCode } from "@/lib/mapa/course-status";
import {
  extractHorarioCodigoFromText,
  hasParseableSigaaHorario,
  parseSigaaCodigoHorario,
} from "@/lib/schedule/parse-sigaa-codigo";
import type { DisciplinaRow, TurmaOfertadaRow } from "@/lib/types/db";
import {
  TURMA_SCHEDULE_BLOCKER_MESSAGE,
  TURMA_SCHEDULE_UNCERTAIN_MESSAGE,
  type TurmaOfertadaCourse,
} from "@/lib/types/turmas-ofertadas-api";
import { classifyTurmaCategoria } from "@/lib/turmas-ofertadas/classify-turma-categoria";
import { findDisciplinaForTurmaOffer } from "@/lib/turmas-ofertadas/find-disciplina-for-turma-offer";
import { resolveEnrollmentEligibility } from "@/lib/turmas-ofertadas/resolve-enrollment-eligibility";
import type { TurmasEnrollmentContext } from "@/lib/turmas-ofertadas/assemble-turmas-enrollment-context";

// Paleta de matizes bem separados no círculo cromático (~36° entre cada),
// legíveis sobre o fundo escuro. Evita tons próximos (ex.: dois laranjas) que
// dificultavam distinguir disciplinas adjacentes.
const OFFER_COLORS = [
  "#FF5C5C", // vermelho
  "#FF9838", // laranja
  "#E3C93A", // amarelo
  "#57D45A", // verde
  "#25C685", // verde-esmeralda
  "#28D2D2", // ciano
  "#4D94FF", // azul
  "#7C74FF", // índigo
  "#B863F5", // roxo
  "#F55C9E", // rosa
] as const;

function colorForCode(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i += 1) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  }
  return OFFER_COLORS[hash % OFFER_COLORS.length];
}

function mapEnrollmentStatus(
  disciplina: DisciplinaRow | undefined,
  codigo: string,
  context: TurmasEnrollmentContext
): Pick<TurmaOfertadaCourse, "status" | "pendingPrereqCodes" | "prerequisiteHint"> {
  if (context.completed.has(codigo.trim().toUpperCase())) {
    return { status: "done", pendingPrereqCodes: [], prerequisiteHint: null };
  }

  const resolved = resolveEnrollmentEligibility(disciplina, codigo, context);

  if (resolved.eligibility === "hidden") {
    return { status: "locked", pendingPrereqCodes: [], prerequisiteHint: null };
  }

  if (resolved.eligibility === "conditional") {
    return {
      status: "conditional",
      pendingPrereqCodes: resolved.pendingPrereqCodes,
      prerequisiteHint: "conditional",
    };
  }

  return { status: "unlocked", pendingPrereqCodes: [], prerequisiteHint: null };
}

export function resolveEffectiveCodigoHorario(row: TurmaOfertadaRow): string | null {
  if (hasParseableSigaaHorario(row.codigo_horario)) {
    return row.codigo_horario;
  }

  const fromExibicao = extractHorarioCodigoFromText(row.horario_exibicao ?? "");
  if (fromExibicao) return fromExibicao;

  const fromStored = extractHorarioCodigoFromText(row.codigo_horario ?? "");
  if (fromStored) return fromStored;

  return row.codigo_horario?.trim() || null;
}

function resolveScheduleBlocker(
  row: TurmaOfertadaRow,
  codigoHorario: string | null
): {
  scheduleBlocker: boolean;
  scheduleWarningMessage: string | null;
} {
  const hasHorario = hasParseableSigaaHorario(codigoHorario);
  const pendente = row.situacao === "pendente";

  if (!hasHorario) {
    return {
      scheduleBlocker: true,
      scheduleWarningMessage: pendente
        ? TURMA_SCHEDULE_BLOCKER_MESSAGE
        : "Horário ainda não publicado no SIGAA.",
    };
  }

  if (pendente) {
    return {
      scheduleBlocker: false,
      scheduleWarningMessage: TURMA_SCHEDULE_UNCERTAIN_MESSAGE,
    };
  }

  return { scheduleBlocker: false, scheduleWarningMessage: null };
}

function resolveCoRequisitoFields(
  code: string,
  context: TurmasEnrollmentContext
): Pick<TurmaOfertadaCourse, "coRequisitoCodes" | "waivedCoRequisitoCodes"> {
  const normalized = normalizeDisciplinaCode(code);
  const all = context.coRequisitos.get(normalized) ?? [];
  const waived = all.filter((item) => context.completed.has(item));

  return {
    coRequisitoCodes: all,
    waivedCoRequisitoCodes: waived,
  };
}

export function mapTurmaRowToCourse(
  row: TurmaOfertadaRow,
  context: TurmasEnrollmentContext
): TurmaOfertadaCourse {
  const disciplina = findDisciplinaForTurmaOffer(
    row.codigo_disciplina,
    row.nome,
    context.disciplinas
  );
  const code = disciplina?.codigo ?? row.codigo_disciplina;
  const codigoHorario = resolveEffectiveCodigoHorario(row);
  const slots = parseSigaaCodigoHorario(codigoHorario).map(
    ({ dayIdx, slotIdx }) => ({ day: dayIdx, slot: slotIdx })
  );
  const schedule = resolveScheduleBlocker(row, codigoHorario);
  const categoria = classifyTurmaCategoria(disciplina);
  const enrollment = mapEnrollmentStatus(disciplina, code, context);
  const corequisitos = resolveCoRequisitoFields(code, context);

  return {
    turmaSigaaId: row.turma_sigaa_id,
    code,
    name: disciplina?.nome ?? row.nome,
    status: enrollment.status,
    pendingPrereqCodes: enrollment.pendingPrereqCodes,
    prerequisiteHint: enrollment.prerequisiteHint,
    coRequisitoCodes: corequisitos.coRequisitoCodes,
    waivedCoRequisitoCodes: corequisitos.waivedCoRequisitoCodes,
    color: colorForCode(code),
    room: row.local?.trim() || "—",
    professor: row.professor?.trim() || "—",
    ch: normalizeCefetCh(row.carga_horaria ?? disciplina?.carga_horaria ?? 60),
    turmaCodigo: row.turma_codigo,
    semestre: row.semestre,
    periodo: disciplina?.periodo ?? null,
    codigoHorario,
    vagas: row.vagas,
    slots,
    situacao: row.situacao === "pendente" ? "pendente" : "atendida",
    categoria,
    scheduleBlocker: schedule.scheduleBlocker,
    scheduleWarningMessage: schedule.scheduleWarningMessage,
    sigaaComponente: row.sigaa_componente,
    departamento: row.departamento,
  };
}
