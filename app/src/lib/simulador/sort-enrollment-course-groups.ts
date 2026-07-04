import { normalizeDisciplinaCode } from "@/lib/mapa/course-status";
import type { EnrollmentCourseGroup } from "@/lib/simulador/group-enrollment-courses";

const LABORATORY_PREFIX = /^laborat[oó]rio\b/i;

export function isEnrollmentLaboratoryName(name: string): boolean {
  return LABORATORY_PREFIX.test(name.trim());
}

export function isEnrollmentLaboratoryGroup(group: EnrollmentCourseGroup): boolean {
  const primary = group.variants[0];
  const label = primary?.name ?? group.name;
  return isEnrollmentLaboratoryName(label);
}

function normalizeSortLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function groupAlphabeticalKey(group: EnrollmentCourseGroup): string {
  return normalizeSortLabel(group.name);
}

function groupNormalizedCode(group: EnrollmentCourseGroup): string {
  return normalizeDisciplinaCode(group.code);
}

function collectGroupCorequisiteCodes(group: EnrollmentCourseGroup): Set<string> {
  const codes = new Set<string>();
  for (const variant of group.variants) {
    for (const code of variant.coRequisitoCodes) {
      if (!code) continue;
      codes.add(normalizeDisciplinaCode(code));
    }
  }
  return codes;
}

function groupsShareCorequisiteLink(
  left: EnrollmentCourseGroup,
  right: EnrollmentCourseGroup
): boolean {
  const leftCode = groupNormalizedCode(left);
  const rightCode = groupNormalizedCode(right);
  const leftCoreqs = collectGroupCorequisiteCodes(left);
  const rightCoreqs = collectGroupCorequisiteCodes(right);

  return leftCoreqs.has(rightCode) || rightCoreqs.has(leftCode);
}

function isTheoryLaboratoryCorequisitePair(
  left: EnrollmentCourseGroup,
  right: EnrollmentCourseGroup
): boolean {
  if (!groupsShareCorequisiteLink(left, right)) return false;

  const leftLab = isEnrollmentLaboratoryGroup(left);
  const rightLab = isEnrollmentLaboratoryGroup(right);
  return leftLab !== rightLab;
}

function buildTheoryLaboratoryBlock(
  theory: EnrollmentCourseGroup,
  laboratory: EnrollmentCourseGroup
): EnrollmentCourseGroup[] {
  return [theory, laboratory];
}

/** Teoria acima do lab quando forem corequisitos; demais casos, ordem alfabética. */
export function sortEnrollmentCourseGroups(
  groups: EnrollmentCourseGroup[]
): EnrollmentCourseGroup[] {
  const used = new Set<number>();
  const blocks: EnrollmentCourseGroup[][] = [];

  for (let index = 0; index < groups.length; index += 1) {
    if (used.has(index)) continue;

    const current = groups[index];
    let pairedIndex: number | null = null;

    for (let candidateIndex = index + 1; candidateIndex < groups.length; candidateIndex += 1) {
      if (used.has(candidateIndex)) continue;

      const candidate = groups[candidateIndex];
      if (!isTheoryLaboratoryCorequisitePair(current, candidate)) continue;

      pairedIndex = candidateIndex;
      break;
    }

    if (pairedIndex == null) {
      blocks.push([current]);
      used.add(index);
      continue;
    }

    const partner = groups[pairedIndex];
    const currentIsLab = isEnrollmentLaboratoryGroup(current);
    const block = currentIsLab
      ? buildTheoryLaboratoryBlock(partner, current)
      : buildTheoryLaboratoryBlock(current, partner);

    blocks.push(block);
    used.add(index);
    used.add(pairedIndex);
  }

  blocks.sort((left, right) =>
    groupAlphabeticalKey(left[0]).localeCompare(groupAlphabeticalKey(right[0]), "pt-BR")
  );

  return blocks.flat();
}
