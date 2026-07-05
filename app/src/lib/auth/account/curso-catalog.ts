import type { AppCursoId } from "@/lib/auth/account/types";

export const APP_CURSO_IDS: readonly AppCursoId[] = [
  "eng-computacao",
  "eng-mecatronica",
  "design-moda",
] as const;

const CURSO_LABELS: Record<AppCursoId, string> = {
  "eng-computacao": "Engenharia da Computação",
  "eng-mecatronica": "Engenharia Mecatrônica",
  "design-moda": "Design de Moda",
};

export function isAppCursoId(value: string): value is AppCursoId {
  return (APP_CURSO_IDS as readonly string[]).includes(value);
}

export function resolveCursoLabel(cursoId: AppCursoId): string {
  return CURSO_LABELS[cursoId];
}
