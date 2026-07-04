import {
  buildMutualCorequisitoCluster,
  isMutualCorequisitoPartnerScheduleLocked,
} from "@/lib/simulador/corequisito-cluster-viability";
import { normalizeDisciplinaCode } from "@/lib/mapa/course-status";
import type { SimuladorPlacementContext } from "@/lib/simulador/corequisito-schedule-policy";
import {
  buildTurmaShortLabelRegistry,
  formatScheduleCellHorario,
  formatTurmaShortLabel,
} from "@/lib/simulador/turma-course-utils";
import {
  isTurmaScheduleLocked,
  resolveTurmaScheduleConflictEntries,
  type TurmaScheduleConflictEntry,
} from "@/lib/simulador/turma-schedule-placement";
import type { ScheduleSlot } from "@/lib/types/schedule";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

export interface EnrollmentScheduleConflictItem {
  shortLabel: string;
  name: string;
  horario: string;
}

export interface EnrollmentScheduleConflictNotice {
  selectedShortLabel: string;
  selectedName: string;
  kind: "direct" | "partner";
  conflicts: EnrollmentScheduleConflictItem[];
  partnerShortLabel?: string;
  partnerName?: string;
}

function mapConflictEntry(
  entry: TurmaScheduleConflictEntry,
  catalog: TurmaOfertadaCourse[],
  registry: Map<string, string>
): EnrollmentScheduleConflictItem {
  const match = catalog.find(
    (item) =>
      normalizeDisciplinaCode(item.code) ===
      normalizeDisciplinaCode(entry.occupantCode)
  );

  const shortLabel = formatTurmaShortLabel(
    {
      code: entry.occupantCode || match?.code || "?",
      name: match?.name ?? entry.occupantName,
      shortLabel: match?.shortLabel,
    },
    registry
  );

  return {
    shortLabel,
    name: match?.name?.trim() ?? entry.occupantName,
    horario: formatScheduleCellHorario(entry.dayIdx, entry.slotIdx),
  };
}

function dedupeConflictItems(
  items: EnrollmentScheduleConflictItem[]
): EnrollmentScheduleConflictItem[] {
  const seen = new Set<string>();
  const unique: EnrollmentScheduleConflictItem[] = [];

  for (const item of items) {
    const key = `${item.shortLabel}|${item.horario}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique;
}

function resolveDirectConflictNotice(
  course: TurmaOfertadaCourse,
  catalog: TurmaOfertadaCourse[],
  schedule: ScheduleSlot[][]
): EnrollmentScheduleConflictNotice {
  const registry = buildTurmaShortLabelRegistry(catalog);
  const raw = resolveTurmaScheduleConflictEntries(course, schedule);
  const conflicts = dedupeConflictItems(
    raw.map((entry) => mapConflictEntry(entry, catalog, registry))
  );

  return {
    kind: "direct",
    selectedShortLabel: formatTurmaShortLabel(course, registry),
    selectedName: course.name,
    conflicts,
  };
}

function resolvePartnerConflictNotice(
  course: TurmaOfertadaCourse,
  catalog: TurmaOfertadaCourse[],
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext
): EnrollmentScheduleConflictNotice | null {
  const registry = buildTurmaShortLabelRegistry(catalog);
  const selfCode = normalizeDisciplinaCode(course.code);
  const cluster = buildMutualCorequisitoCluster(course.code, context);

  for (const partnerCode of cluster) {
    if (partnerCode === selfCode || context.completed.has(partnerCode)) continue;

    for (const partner of catalog) {
      if (normalizeDisciplinaCode(partner.code) !== partnerCode) continue;
      if (!isTurmaScheduleLocked(partner, schedule)) continue;

      const raw = resolveTurmaScheduleConflictEntries(partner, schedule);
      const conflicts = dedupeConflictItems(
        raw.map((entry) => mapConflictEntry(entry, catalog, registry))
      );
      if (conflicts.length === 0) continue;

      return {
        kind: "partner",
        selectedShortLabel: formatTurmaShortLabel(course, registry),
        selectedName: course.name,
        partnerShortLabel: formatTurmaShortLabel(partner, registry),
        partnerName: partner.name,
        conflicts,
      };
    }
  }

  return null;
}

export function resolveEnrollmentScheduleConflictNotice(
  course: TurmaOfertadaCourse,
  catalog: TurmaOfertadaCourse[],
  schedule: ScheduleSlot[][],
  context: SimuladorPlacementContext
): EnrollmentScheduleConflictNotice | null {
  const directLocked = isTurmaScheduleLocked(course, schedule);
  const partnerLocked = isMutualCorequisitoPartnerScheduleLocked(
    course,
    schedule,
    context,
    catalog
  );

  if (!directLocked && !partnerLocked) return null;

  if (directLocked) {
    const notice = resolveDirectConflictNotice(course, catalog, schedule);
    return notice.conflicts.length > 0 ? notice : null;
  }

  return resolvePartnerConflictNotice(course, catalog, schedule, context);
}
