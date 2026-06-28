import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";

export function invalidateIntegralizacaoQueries(
  queryClient: QueryClient
): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.integralizacao() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
}
