import type { DisciplinaListFilter } from "@/lib/types/disciplinas-api";

export const queryKeys = {
  all: ["planner"] as const,
  dashboard: () => [...queryKeys.all, "dashboard"] as const,
  disciplinas: (q?: string, filter?: DisciplinaListFilter) =>
    [...queryKeys.all, "disciplinas", { q: q ?? "", filter: filter ?? "todas" }] as const,
  disciplina: (code: string) =>
    [...queryKeys.all, "disciplina", code] as const,
  calendar: () => [...queryKeys.all, "calendar"] as const,
  integralizacao: () => [...queryKeys.all, "integralizacao"] as const,
  mapa: () => [...queryKeys.all, "mapa"] as const,
  schedule: () => [...queryKeys.all, "schedule"] as const,
  turmasOfertadas: () => [...queryKeys.all, "turmas-ofertadas"] as const,
  notifications: () => [...queryKeys.all, "notifications"] as const,
};
