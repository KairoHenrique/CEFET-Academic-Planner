"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiClientError, getDisciplinas } from "@/lib/api/client";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { resolveDisciplinaFilterLabel } from "@/lib/disciplinas/list-filters";
import { queryKeys } from "@/lib/query/keys";
import type { DisciplinaListFilter } from "@/lib/types/disciplinas-api";

export function resolveDisciplinaFilter(label: string): DisciplinaListFilter {
  return resolveDisciplinaFilterLabel(label);
}

export function useDisciplinas(search = "", filterLabel = "Todas") {
  const debouncedSearch = useDebouncedValue(search.trim());
  const filter = resolveDisciplinaFilter(filterLabel);

  const query = useQuery({
    queryKey: queryKeys.disciplinas(debouncedSearch, filter),
    queryFn: () => getDisciplinas(debouncedSearch || undefined, filter),
  });

  return {
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error:
      query.error instanceof ApiClientError
        ? query.error.message
        : query.error
          ? "Não foi possível carregar as disciplinas."
          : null,
    refetch: query.refetch,
  };
}
