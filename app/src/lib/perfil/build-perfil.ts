import { getAluno } from "@/lib/db/queries";
import { buildInitials } from "@/lib/perfil/build-initials";
import type { PerfilResponse } from "@/lib/types/perfil-api";
import {
  getSyncAutoIntervalMinutes,
  getSyncLastAt,
} from "@/lib/sync/sync-preferences";

export function buildPerfil(): PerfilResponse {
  const aluno = getAluno();

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
      lastSyncAt: getSyncLastAt(),
    },
  };
}
