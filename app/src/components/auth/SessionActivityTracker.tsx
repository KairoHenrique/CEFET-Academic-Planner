"use client";

import { useEffect } from "react";
import { touchSyncActivity } from "@/lib/auth/sync-session";

/** Renova a sessão de sync enquanto o usuário navega no app. */
export function SessionActivityTracker() {
  useEffect(() => {
    const onActivity = () => touchSyncActivity();

    window.addEventListener("click", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });

    return () => {
      window.removeEventListener("click", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
    };
  }, []);

  return null;
}
