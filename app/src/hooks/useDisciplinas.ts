"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiClientError, getDisciplinas } from "@/lib/api/client";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { queryKeys } from "@/lib/query/keys";
import type { DisciplinaListFilter } from "@/lib/types/disciplinas-api";

const FILTER_LABELS: Record<string, DisciplinaListFilter> = {
  Todas: "todas",
  "Com tarefas": "com_tarefas",
  "Risco de faltas": "risco_faltas",
};

export function resolveDisciplinaFilter(label: string): DisciplinaListFilter {
  return FILTER_LABELS[label] ?? "todas";
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
