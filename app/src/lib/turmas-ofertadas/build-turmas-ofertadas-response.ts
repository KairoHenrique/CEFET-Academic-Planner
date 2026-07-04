import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import {
  getDisciplinas,
  getHistorico,
  getIntegralizacao,
  getRequisitos,
  getSemestreAtual,
  getTurmasOfertadas,
} from "@/lib/db/queries";
import { normalizeCefetCh } from "@/lib/disciplinas/cefet-ch";
import {
  buildCompletedDisciplinaSet,
  buildCoRequisitoMap,
  buildCursandoDisciplinaSet,
  buildCurrentDisciplinaSet,
  buildFailedDisciplinaSet,
  buildPreRequisitoMap,
  normalizeDisciplinaCode,
} from "@/lib/mapa/course-status";
import { computeChDoneFromDisciplinas } from "@/lib/integralizacao/compute-ch-from-disciplinas";
import { getChCatalog } from "@/lib/integralizacao/ch-catalog";
import { getObrigatoriaTotalFromCatalog } from "@/lib/mapa/period-ch-gates";
import {
  extractHorarioCodigoFromText,
  hasParseableSigaaHorario,
  parseSigaaCodigoHorario,
} from "@/lib/schedule/parse-sigaa-codigo";
import { getTurmasOfertadasLastAt } from "@/lib/sync/sync-preferences";
import type { DisciplinaRow, TurmaOfertadaRow } from "@/lib/types/db";
import {
  TURMA_SCHEDULE_BLOCKER_MESSAGE,
  TURMA_SCHEDULE_UNCERTAIN_MESSAGE,
  type TurmaOfertadaCourse,
  type TurmasOfertadasEnrollmentContext,
  type TurmasOfertadasResponse,
} from "@/lib/types/turmas-ofertadas-api";
import { classifyTurmaCategoria } from "@/lib/turmas-ofertadas/classify-turma-categoria";
import { attachUniqueShortLabels } from "@/lib/disciplinas/attach-unique-short-labels";
import { applyCorequisitoOfferGate } from "@/lib/turmas-ofertadas/apply-corequisito-offer-gate";
import { dedupeTurmaOfertadaCourses } from "@/lib/turmas-ofertadas/dedupe-turma-ofertada-courses";
import { findDisciplinaForTurmaOffer } from "@/lib/turmas-ofertadas/find-disciplina-for-turma-offer";
import { resolveEnrollmentEligibility } from "@/lib/turmas-ofertadas/resolve-enrollment-eligibility";

const OFFER_COLORS = [
  "#3FB950",
  "#79C0FF",
  "#A371F7",
  "#F0883E",
  "#FFA657",
  "#FF7B72",
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
  context: {
    disciplinas: DisciplinaRow[];
    current: Set<string>;
    completed: Set<string>;
    failed: Set<string>;
    preRequisitos: Map<string, string[]>;
    coRequisitos: Map<string, string[]>;
    obrigatoriaDone: number;
    obrigatoriaTotal: number;
  }
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

function resolveEffectiveCodigoHorario(row: TurmaOfertadaRow): string | null {
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
  coRequisitos: Map<string, string[]>,
  completed: Set<string>
): Pick<TurmaOfertadaCourse, "coRequisitoCodes" | "waivedCoRequisitoCodes"> {
  const normalized = normalizeDisciplinaCode(code);
  const all = coRequisitos.get(normalized) ?? [];
  const waived = all.filter((item) => completed.has(item));

  return {
    coRequisitoCodes: all,
    waivedCoRequisitoCodes: waived,
  };
}

function serializeDisciplinaNames(
  disciplinas: DisciplinaRow[]
): TurmasOfertadasEnrollmentContext["disciplinaNames"] {
  const record: TurmasOfertadasEnrollmentContext["disciplinaNames"] = {};

  for (const disciplina of disciplinas) {
    const code = normalizeDisciplinaCode(disciplina.codigo);
    const name = disciplina.nome?.trim();
    if (!code || !name) continue;
    record[code] = name;
  }

  return record;
}

function serializeCoRequisitoMap(
  map: Map<string, string[]>
): TurmasOfertadasEnrollmentContext["coRequisitos"] {
  const record: TurmasOfertadasEnrollmentContext["coRequisitos"] = {};

  for (const [disciplinaId, codes] of map) {
    record[disciplinaId] = codes;
  }

  return record;
}

function mapTurmaRowToCourse(
  row: TurmaOfertadaRow,
  context: {
    disciplinas: DisciplinaRow[];
    current: Set<string>;
    completed: Set<string>;
    failed: Set<string>;
    preRequisitos: Map<string, string[]>;
    coRequisitos: Map<string, string[]>;
    obrigatoriaDone: number;
    obrigatoriaTotal: number;
  }
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
  const corequisitos = resolveCoRequisitoFields(
    code,
    context.coRequisitos,
    context.completed
  );

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
    ch: normalizeCefetCh(
      row.carga_horaria ?? disciplina?.carga_horaria ?? 60
    ),
    turmaCodigo: row.turma_codigo,
    semestre: row.semestre,
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

export function buildTurmasOfertadasResponse(
  referenceDate = new Date()
): TurmasOfertadasResponse {
  const semestre = resolveNextAcademicSemesterLabel(referenceDate);
  const rows = getTurmasOfertadas(semestre);
  const disciplinas = getDisciplinas();
  const historico = getHistorico();
  const semestreAtual = getSemestreAtual();
  const requisitos = getRequisitos();

  const completed = buildCompletedDisciplinaSet(historico);
  const failed = buildFailedDisciplinaSet(historico);
  const cursando = buildCursandoDisciplinaSet(historico);
  const current = buildCurrentDisciplinaSet([
    ...semestreAtual.map((row) => row.disciplina_id),
    ...[...cursando],
  ]);
  const preRequisitos = buildPreRequisitoMap(requisitos);
  const coRequisitos = buildCoRequisitoMap(requisitos);
  const catalog = getChCatalog();
  const integralizacaoRows = getIntegralizacao();
  const syncedObrigatoria =
    integralizacaoRows.find(
      (row) => row.tipo_ch === "Obrigatória" && row.manual === 0
    )?.concluido ?? 0;

  const computedCh = computeChDoneFromDisciplinas(
    disciplinas,
    historico,
    semestreAtual.map((row) => row.disciplina_id)
  );
  const obrigatoriaDone = Math.max(computedCh.Obrigatória, syncedObrigatoria);
  const obrigatoriaTotal = getObrigatoriaTotalFromCatalog(catalog);

  const context = {
    disciplinas,
    current,
    completed,
    failed,
    preRequisitos,
    coRequisitos,
    obrigatoriaDone,
    obrigatoriaTotal,
  };

  const gated = applyCorequisitoOfferGate(
    dedupeTurmaOfertadaCourses(rows.map((row) => mapTurmaRowToCourse(row, context)))
  );
  const courses = attachUniqueShortLabels(gated);
  const curso = courses.filter((item) => item.categoria === "curso");
  const optativas = courses.filter((item) => item.categoria === "optativa");
  const syncedAt =
    rows.find((row) => row.synced_at)?.synced_at ??
    getTurmasOfertadasLastAt();

  return {
    semestre,
    syncedAt,
    enrollmentContext: {
      completedDisciplinaCodes: Array.from(completed),
      coRequisitos: serializeCoRequisitoMap(coRequisitos),
      disciplinaNames: serializeDisciplinaNames(disciplinas),
    },
    curso,
    optativas,
    courses,
    empty: courses.length === 0,
  };
}
