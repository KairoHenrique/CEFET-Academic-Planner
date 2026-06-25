"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiClientError, getDisciplina } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export function useDisciplina(code: string) {
  const query = useQuery({
    queryKey: queryKeys.disciplina(code),
    queryFn: () => getDisciplina(code),
    enabled: Boolean(code),
  });

  const notFound =
    query.error instanceof ApiClientError && query.error.status === 404;

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error:
      query.error instanceof ApiClientError && query.error.status !== 404
        ? query.error.message
        : query.error && !notFound
          ? "Não foi possível carregar a disciplina."
          : null,
    notFound,
    refetch: query.refetch,
  };
}
