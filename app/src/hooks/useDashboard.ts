"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApiClientError,
  getDashboard,
  SYNC_COMPLETE_EVENT,
} from "@/lib/api/client";
import type { DashboardResponse } from "@/lib/types/dashboard";

export function useDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSync, setNeedsSync] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsSync(false);

    try {
      const dashboard = await getDashboard();
      setData(dashboard);
    } catch (err) {
      setData(null);
      if (err instanceof ApiClientError && err.status === 404) {
        setNeedsSync(true);
      } else {
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Não foi possível carregar o dashboard."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const handleSyncComplete = () => {
      void refetch();
    };

    window.addEventListener(SYNC_COMPLETE_EVENT, handleSyncComplete);
    return () =>
      window.removeEventListener(SYNC_COMPLETE_EVENT, handleSyncComplete);
  }, [refetch]);

  return { data, loading, error, needsSync, refetch };
}
