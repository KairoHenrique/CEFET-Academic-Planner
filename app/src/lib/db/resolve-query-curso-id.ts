import { getActiveQueryCursoId } from "@/lib/auth/account/query-curso-context";
import { isAppCursoId } from "@/lib/auth/account/curso-catalog";
import { resolveDefaultCursoId } from "@/lib/db/backend/config";

export function resolveQueryCursoId(): string {
  const active = getActiveQueryCursoId();
  if (active) {
    return active;
  }

  const fallback = resolveDefaultCursoId();
  return isAppCursoId(fallback) ? fallback : "eng-computacao";
}
