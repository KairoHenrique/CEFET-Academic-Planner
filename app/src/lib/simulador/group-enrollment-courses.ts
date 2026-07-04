import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";
import { sortEnrollmentCourseGroups } from "@/lib/simulador/sort-enrollment-course-groups";

export interface EnrollmentCourseGroup {
  id: string;
  code: string;
  name: string;
  color: string;
  semestre: string;
  variants: TurmaOfertadaCourse[];
  multiVariant: boolean;
}

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function areExclusiveEnrollmentVariants(
  left: Pick<TurmaOfertadaCourse, "semestre" | "code" | "name" | "turmaSigaaId">,
  right: Pick<TurmaOfertadaCourse, "semestre" | "code" | "name" | "turmaSigaaId">
): boolean {
  if (left.semestre !== right.semestre) return false;
  if (left.turmaSigaaId === right.turmaSigaaId) return false;
  if (normalizeCode(left.code) === normalizeCode(right.code)) return true;
  return normalizeName(left.name) === normalizeName(right.name);
}

function buildCodeKey(course: TurmaOfertadaCourse): string {
  return `${course.semestre}|${course.code.trim().toUpperCase()}`;
}

function buildNameKey(course: TurmaOfertadaCourse): string {
  return `${course.semestre}|${normalizeName(course.name)}`;
}

function sortVariants(left: TurmaOfertadaCourse, right: TurmaOfertadaCourse): number {
  const leftHorario = left.codigoHorario ?? "";
  const rightHorario = right.codigoHorario ?? "";
  if (leftHorario !== rightHorario) return leftHorario.localeCompare(rightHorario);
  return left.turmaSigaaId.localeCompare(right.turmaSigaaId);
}

function buildGroupFromVariants(variants: TurmaOfertadaCourse[]): EnrollmentCourseGroup {
  const sorted = [...variants].sort(sortVariants);
  const primary = sorted[0];

  return {
    id: sorted.map((item) => item.turmaSigaaId).join("::"),
    code: primary.code,
    name: primary.name,
    color: primary.color,
    semestre: primary.semestre,
    variants: sorted,
    multiVariant: sorted.length > 1,
  };
}

/** Agrupa turmas com mesmo código ou mesmo nome exato (horários diferentes). */
export function groupEnrollmentCourses(
  courses: TurmaOfertadaCourse[]
): EnrollmentCourseGroup[] {
  const codeBuckets = new Map<string, TurmaOfertadaCourse[]>();
  const nameBuckets = new Map<string, TurmaOfertadaCourse[]>();

  for (const course of courses) {
    const codeKey = buildCodeKey(course);
    const codeList = codeBuckets.get(codeKey) ?? [];
    codeList.push(course);
    codeBuckets.set(codeKey, codeList);

    const nameKey = buildNameKey(course);
    const nameList = nameBuckets.get(nameKey) ?? [];
    nameList.push(course);
    nameBuckets.set(nameKey, nameList);
  }

  const processed = new Set<string>();
  const groups: EnrollmentCourseGroup[] = [];

  for (const course of courses) {
    if (processed.has(course.turmaSigaaId)) continue;

    const codeSiblings = codeBuckets.get(buildCodeKey(course)) ?? [course];
    if (codeSiblings.length > 1) {
      const group = buildGroupFromVariants(codeSiblings);
      groups.push(group);
      for (const sibling of codeSiblings) processed.add(sibling.turmaSigaaId);
      continue;
    }

    const nameSiblings = nameBuckets.get(buildNameKey(course)) ?? [course];
    if (nameSiblings.length > 1) {
      const group = buildGroupFromVariants(nameSiblings);
      groups.push(group);
      for (const sibling of nameSiblings) processed.add(sibling.turmaSigaaId);
      continue;
    }

    groups.push(buildGroupFromVariants([course]));
    processed.add(course.turmaSigaaId);
  }

  return sortEnrollmentCourseGroups(groups);
}
