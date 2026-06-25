import type { Subject } from "@/config/mock/subjects";

export function computeWeightedAverage(
  subjects: Subject[],
  gradeOverrides: Record<string, number | null> = {}
): number | null {
  const withGrades = subjects.filter((subject) => {
    const grade = gradeOverrides[subject.code] ?? subject.grade;
    return grade !== null && (subject.ch ?? 0) > 0;
  });

  if (withGrades.length === 0) return null;

  const totalCh = withGrades.reduce((acc, s) => acc + (s.ch ?? 0), 0);
  const weighted = withGrades.reduce((acc, subject) => {
    const grade = gradeOverrides[subject.code] ?? subject.grade ?? 0;
    return acc + grade * (subject.ch ?? 0);
  }, 0);

  return weighted / totalCh;
}

export function formatRg(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(2);
}
