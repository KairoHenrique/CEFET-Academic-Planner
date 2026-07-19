import type { CorequisitoObligation } from "./corequisito-cluster-viability";
import { resolveEnrollmentCourseSelectability } from "./enrollment-course-selectability";
import type { SimuladorPlacementContext } from "./corequisito-schedule-policy";
import {
  canPlaceTurmaBasic,
  getTurmaAllowedPositions,
  scheduleCellKey,
} from "./turma-schedule-placement";
import type { ScheduleSlot } from "../types";
import type { TurmaOfertadaCourse } from "../types";

/** Cores de preview por opção de horário (sem vermelho — 2ª = roxo). */
export const ENROLLMENT_VARIANT_PREVIEW_COLORS = [
  "#3fb950",
  "#a371f7",
  "#d4a843",
  "#58a6ff",
  "#39d0d8",
] as const;

export interface EnrollmentVariantPreviewOption {
  course: TurmaOfertadaCourse;
  color: string;
}

export type EnrollmentVariantPreviewCell = EnrollmentVariantPreviewOption[];

export function buildPreviewCellSplitGradient(
  colors: readonly string[]
): string | undefined {
  if (colors.length === 0) return undefined;

  const mix = (hex: string) => `color-mix(in srgb, ${hex} 22%, transparent)`;

  if (colors.length === 1) {
    return mix(colors[0]!);
  }

  const segment = 100 / colors.length;
  const stops: string[] = [];

  colors.forEach((color, index) => {
    const start = index * segment;
    const end = (index + 1) * segment;
    const fill = mix(color);
    stops.push(`${fill} ${start}%`, `${fill} ${end}%`);
  });

  return `linear-gradient(to right, ${stops.join(", ")})`;
}

export function buildPreviewCellBorderColor(colors: readonly string[]): string {
  if (colors.length === 0) return "var(--border-default)";
  return `color-mix(in srgb, ${colors[0]!} 65%, var(--border-default))`;
}

export function resolvePreviewSegmentIndex(
  optionCount: number,
  clickOffsetX: number,
  elementWidth: number
): number {
  if (optionCount <= 1) return 0;

  const ratio = clickOffsetX / Math.max(elementWidth, 1);
  const index = Math.floor(ratio * optionCount);
  return Math.min(Math.max(index, 0), optionCount - 1);
}

export function buildMultiVariantPreviewMap(
  variants: TurmaOfertadaCourse[],
  catalog: TurmaOfertadaCourse[],
  schedule: ScheduleSlot[][],
  placementContext: SimuladorPlacementContext,
  corequisitoObligation: CorequisitoObligation | null
): Map<string, EnrollmentVariantPreviewCell> {
  const map = new Map<string, EnrollmentVariantPreviewCell>();
  let colorIndex = 0;

  for (const variant of variants) {
    const state = resolveEnrollmentCourseSelectability(
      variant,
      catalog,
      schedule,
      placementContext,
      corequisitoObligation
    );

    if (!state.selectable || state.timeLocked) continue;
    if (!canPlaceTurmaBasic(variant, schedule)) continue;

    const color =
      ENROLLMENT_VARIANT_PREVIEW_COLORS[
        colorIndex % ENROLLMENT_VARIANT_PREVIEW_COLORS.length
      ];
    colorIndex += 1;

    for (const { dayIdx, slotIdx } of getTurmaAllowedPositions(variant)) {
      if (schedule[dayIdx]?.[slotIdx]) continue;

      const key = scheduleCellKey(dayIdx, slotIdx);
      const existing = map.get(key) ?? [];
      if (existing.some((item) => item.course.turmaSigaaId === variant.turmaSigaaId)) {
        continue;
      }

      map.set(key, [...existing, { course: variant, color }]);
    }
  }

  return map;
}

export function resolvePreviewCourseAtCell(
  map: ReadonlyMap<string, EnrollmentVariantPreviewCell>,
  dayIdx: number,
  slotIdx: number,
  segmentIndex = 0
): TurmaOfertadaCourse | null {
  const options = map.get(scheduleCellKey(dayIdx, slotIdx));
  if (!options || options.length === 0) return null;

  const safeIndex = Math.min(Math.max(segmentIndex, 0), options.length - 1);
  return options[safeIndex]?.course ?? null;
}

export function listPreviewCellColors(
  options: EnrollmentVariantPreviewCell
): string[] {
  return options.map((item) => item.color);
}
