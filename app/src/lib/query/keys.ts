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
  devAccounts: (q?: string) =>
    [...queryKeys.all, "dev", "accounts", { q: q ?? "" }] as const,
  devSession: () => [...queryKeys.all, "dev", "session"] as const,
  devSyncPolicy: () => [...queryKeys.all, "dev", "sync-policy"] as const,
  devSyncStatus: () => [...queryKeys.all, "dev", "sync-status"] as const,
  devAuditLog: () => [...queryKeys.all, "dev", "audit-log"] as const,
};
