import { AsyncLocalStorage } from "node:async_hooks";
import "server-only";
import type { AppCursoId } from "@/lib/auth/account/types";

const cursoContext = new AsyncLocalStorage<AppCursoId | undefined>();

export function runWithQueryCursoId<T>(
  cursoId: AppCursoId | undefined,
  operation: () => T
): T {
  return cursoContext.run(cursoId, operation);
}

export function getActiveQueryCursoId(): AppCursoId | undefined {
  return cursoContext.getStore();
}
