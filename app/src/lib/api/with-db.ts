import { ensureDbReady } from "@/lib/db/bootstrap";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { isPostgresBackend } from "@/lib/db/backend/config";
import { runWithUserDb } from "@/lib/db/connection-manager";
import { runWithQueryCursoId } from "@/lib/auth/account/query-curso-context";
import { runWithTenantUserId } from "@/lib/db/postgres/tenant-context";
import { resolveProfileFromAuthorization } from "@/lib/auth/account/resolve-profile-from-request";
import {
  enforceSubscriptionAccessGate,
  shouldEnforceAccessGate,
} from "@/lib/auth/access/access-gate";
import { apiErrorResponse } from "./response";

const SIGAA_USER_HEADER = "x-planner-sigaa-user";

type RouteHandler<TContext = unknown> = (
  request: Request,
  context: TContext
) => Promise<Response>;

function resolveUsernameFromRequest(request: Request): string | undefined {
  return request.headers.get(SIGAA_USER_HEADER)?.trim() || undefined;
}

async function ensureDatabaseReady(): Promise<void> {
  if (isPostgresBackend()) {
    await ensurePostgresReady();
    return;
  }
  ensureDbReady();
}

export function withDb<TContext = unknown>(
  handler: RouteHandler<TContext>
): RouteHandler<TContext> {
  return async (request, context) => {
    const username = resolveUsernameFromRequest(request);

    const runHandler = async () => {
      try {
        await ensureDatabaseReady();
        return await handler(request, context);
      } catch (error) {
        return apiErrorResponse(error);
      }
    };

    if (isPostgresBackend()) {
      const profile = await resolveProfileFromAuthorization(
        request.headers.get("Authorization")
      );

      if (shouldEnforceAccessGate(request)) {
        try {
          await enforceSubscriptionAccessGate(profile);
        } catch (error) {
          return apiErrorResponse(error);
        }
      }

      const scopedUsername = profile?.cpf ?? username;

      return runWithQueryCursoId(profile?.cursoId, () =>
        runWithTenantUserId(profile?.userId, () =>
          runWithUserDb(scopedUsername, runHandler)
        )
      );
    }

    return runWithUserDb(username, async () => {
      let localCursoId: string | undefined;
      try {
        const { getAluno } = await import("@/lib/db/queries");
        const aluno = getAluno();
        if (aluno && aluno.curso) {
          const c = aluno.curso.toLowerCase();
          if (c.includes("computa")) localCursoId = "eng-computacao";
          else if (c.includes("mecatr")) localCursoId = "eng-mecatronica";
          else if (c.includes("moda")) localCursoId = "design-moda";
        }
      } catch {
        // Ignora erros caso a tabela ainda não exista ou banco não esteja pronto
      }
      
      // Inject course id into the context for offline execution
      return runWithQueryCursoId(localCursoId as any, runHandler);
    });
  };
}

export { SIGAA_USER_HEADER };
