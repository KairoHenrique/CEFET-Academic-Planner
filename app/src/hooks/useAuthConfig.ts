"use client";

import { useEffect, useState } from "react";
import { getAuthConfig } from "@/lib/api/client";
import type { AuthCursoOption } from "@/lib/types/auth-api";

export interface AuthConfigState {
  loading: boolean;
  mode: "cloud" | "sigaa";
  cursos: AuthCursoOption[];
}

const DEFAULT_STATE: AuthConfigState = {
  loading: true,
  mode: "sigaa",
  cursos: [],
};

const AUTH_CONFIG_TIMEOUT_MS = 8_000;

function fallbackSigaaMode(): AuthConfigState {
  return {
    loading: false,
    mode: "sigaa",
    cursos: [],
  };
}

export function useAuthConfig(): AuthConfigState {
  const [state, setState] = useState<AuthConfigState>(DEFAULT_STATE);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => controller.abort(),
      AUTH_CONFIG_TIMEOUT_MS
    );

    void getAuthConfig({ signal: controller.signal })
      .then((config) => {
        if (cancelled) return;
        setState({
          loading: false,
          mode: config.mode,
          cursos: config.cursos,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState(fallbackSigaaMode());
      })
      .finally(() => {
        window.clearTimeout(timer);
      });

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return state;
}
