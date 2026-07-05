import { AsyncLocalStorage } from "node:async_hooks";

const tenantContext = new AsyncLocalStorage<string | undefined>();

export function runWithTenantUserId<T>(
  userId: string | undefined | null,
  operation: () => T
): T {
  const normalized = userId?.trim() || undefined;
  return tenantContext.run(normalized, operation);
}

export function getActiveTenantUserId(): string | undefined {
  return tenantContext.getStore();
}
