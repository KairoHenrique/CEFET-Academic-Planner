import { getAluno } from "@/lib/db/queries";
import { buildInitials } from "@/lib/perfil/build-initials";
import type { PerfilResponse } from "@/lib/types/perfil-api";
import { getSyncRateLimitStatus } from "@/lib/sync/sync-rate-limit";
import { getSyncAutoIntervalMinutes } from "@/lib/sync/sync-preferences";

export function buildPerfil(): PerfilResponse {
  const aluno = getAluno();
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
      automatic: true,
      intervalMinutes: getSyncAutoIntervalMinutes(),
      minIntervalMinutes: rateLimit.minIntervalMinutes,
      lastSyncAt: rateLimit.lastSyncAt,
      nextAllowedAt: rateLimit.nextAllowedAt,
      remainingSeconds: rateLimit.remainingSeconds,
    },
  };
}
