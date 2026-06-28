import { getAluno } from "@/lib/db/queries";
import { buildInitials } from "@/lib/perfil/build-initials";
import type { PerfilResponse } from "@/lib/types/perfil-api";
import { getSyncRateLimitStatus } from "@/lib/sync/sync-rate-limit";
import {
  SYNC_AUTO_INTERVAL_OPTIONS,
  getSyncPreferences,
} from "@/lib/sync/sync-preferences";

export function buildPerfil(): PerfilResponse {
  const aluno = getAluno();
  const prefs = getSyncPreferences();
  const rateLimit = getSyncRateLimitStatus();

  return {
    profile: aluno
      ? {
          matricula: aluno.matricula,
          nome: aluno.nome,
          curso: aluno.curso,
          email: aluno.email,
          semestreEntrada: aluno.semestre_entrada,
          status: aluno.status,
          initials: buildInitials(aluno.nome),
        }
      : null,
    sync: {
      autoEnabled: prefs.autoEnabled,
      intervalMinutes: prefs.intervalMinutes,
      minIntervalMinutes: rateLimit.minIntervalMinutes,
      lastSyncAt: rateLimit.lastSyncAt,
      nextAllowedAt: rateLimit.nextAllowedAt,
      remainingSeconds: rateLimit.remainingSeconds,
      intervalOptions: SYNC_AUTO_INTERVAL_OPTIONS,
    },
  };
}
