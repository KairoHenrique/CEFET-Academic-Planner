"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { SYNC_COMPLETE_EVENT } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return createQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}

function SyncInvalidator() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleSyncComplete = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.all });
    };

    window.addEventListener(SYNC_COMPLETE_EVENT, handleSyncComplete);
    return () =>
      window.removeEventListener(SYNC_COMPLETE_EVENT, handleSyncComplete);
  }, [queryClient]);

  return null;
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SyncInvalidator />
      {children}
    </QueryClientProvider>
  );
}
