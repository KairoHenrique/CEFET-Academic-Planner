"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiClientError,
  deleteSimuladorSimulacao,
  getSimuladorSimulacao,
  getSimuladorSimulacoes,
  postSimuladorSimulacao,
} from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { SimuladorSaveSimulationRequestBody } from "@/lib/types/simulador-api";

export function useSimuladorSimulacoes() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: queryKeys.simuladorSimulacoes(),
    queryFn: () => getSimuladorSimulacoes(),
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: (body: SimuladorSaveSimulationRequestBody) =>
      postSimuladorSimulacao(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.simuladorSimulacoes(),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSimuladorSimulacao(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.simuladorSimulacoes(),
      });
    },
  });

  const loadSimulation = async (id: string) => {
    const response = await queryClient.fetchQuery({
      queryKey: queryKeys.simuladorSimulacao(id),
      queryFn: () => getSimuladorSimulacao(id),
      staleTime: 0,
    });
    return response.simulation;
  };

  const errorMessage =
    listQuery.error instanceof ApiClientError
      ? listQuery.error.message
      : saveMutation.error instanceof ApiClientError
        ? saveMutation.error.message
        : deleteMutation.error instanceof ApiClientError
          ? deleteMutation.error.message
          : null;

  return {
    items: listQuery.data?.items ?? [],
    loading: listQuery.isLoading,
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    error: errorMessage,
    saveSimulation: saveMutation.mutateAsync,
    deleteSimulation: deleteMutation.mutateAsync,
    loadSimulation,
    refetch: listQuery.refetch,
  };
}
