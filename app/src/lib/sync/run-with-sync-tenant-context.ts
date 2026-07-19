import "server-only";
import { isAppCursoId } from "@/lib/auth/account/curso-catalog";
import { findProfileByCpf } from "@/lib/auth/account/profile-repository";
import { runWithQueryCursoId } from "@/lib/auth/account/query-curso-context";
import type { AppCursoId } from "@/lib/auth/account/types";
import { normalizeSigaaUsername } from "@/lib/db/connection-manager";
import { runWithTenantUserId } from "@/lib/db/postgres/tenant-context";

export interface SyncTenantContext {
  cursoId: AppCursoId | undefined;
  userId: string | undefined;
}

/**
 * Resolve curso/user da conta cloud a partir do CPF do sync.
 * Sem Postgres ou sem perfil → undefined (ALS cai no default Eng. Comp.).
 */
export async function resolveSyncTenantContext(
  username: string
): Promise<SyncTenantContext> {
  try {
    const cpf = normalizeSigaaUsername(username);
    if (!/^\d{11}$/.test(cpf)) {
      return { cursoId: undefined, userId: undefined };
    }
    if (!process.env.DATABASE_URL?.trim()) {
      return { cursoId: undefined, userId: undefined };
    }

    const profile = await findProfileByCpf(cpf);
    if (!profile) {
      return { cursoId: undefined, userId: undefined };
    }

    return {
      cursoId: isAppCursoId(profile.cursoId) ? profile.cursoId : undefined,
      userId: profile.userId,
    };
  } catch {
    return { cursoId: undefined, userId: undefined };
  }
}

/** Envolve o pipeline de sync com ALS de curso (+ user cloud quando houver). */
export async function runWithSyncTenantContext<T>(
  username: string,
  operation: () => T | Promise<T>
): Promise<T> {
  const tenant = await resolveSyncTenantContext(username);
  return runWithQueryCursoId(tenant.cursoId, () =>
    runWithTenantUserId(tenant.userId, () => operation())
  );
}
