import type { CorequisitoObligation } from "@/lib/simulador/corequisito-cluster-viability";
import { resolveEnrollmentCourseSelectability } from "@/lib/simulador/enrollment-course-selectability";
import type { SimuladorPlacementContext } from "@/lib/simulador/corequisito-schedule-policy";
import {
  canPlaceTurmaBasic,
  getTurmaAllowedPositions,
  scheduleCellKey,
} from "@/lib/simulador/turma-schedule-placement";
import type { ScheduleSlot } from "@/lib/types/schedule";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

/**
 * Fallback se a turma não tiver `color` (família azul ACME — evita verde/roxo
 * que parecem disciplinas diferentes na grade).
 */
export const ENROLLMENT_VARIANT_PREVIEW_COLORS = [
  "#58a6ff",
  "#3d8fd4",
  "#79b8ff",
  "#2080c8",
  "#9ecbff",
] as const;

/** Tom da mesma cor base para distinguir opções empilhadas no mesmo slot. */
export function resolveVariantPreviewColor(
  variant: TurmaOfertadaCourse,
  optionIndex: number
): string {
  const base = variant.color?.trim() || ENROLLMENT_VARIANT_PREVIEW_COLORS[0]!;
  if (optionIndex <= 0) return base;

  const towardWhite = optionIndex % 2 === 1 ? 0.22 : 0.12;
  return mixHexToward(base, towardWhite > 0.15 ? "#ffffff" : "#0d1117", towardWhite);
}

function mixHexToward(hex: string, target: string, amount: number): string {
  const a = parseHex(hex);
  const b = parseHex(target);
  if (!a || !b) return hex;
  const t = Math.min(1, Math.max(0, amount));
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${[mix(a.r, b.r), mix(a.g, b.g), mix(a.b, b.b)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

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

    const color = resolveVariantPreviewColor(variant, colorIndex);
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
