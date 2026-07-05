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

export function useAuthConfig(): AuthConfigState {
  const [state, setState] = useState<AuthConfigState>(DEFAULT_STATE);

  useEffect(() => {
    let cancelled = false;

    void getAuthConfig()
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
        setState({
          loading: false,
          mode: "sigaa",
          cursos: [],
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
