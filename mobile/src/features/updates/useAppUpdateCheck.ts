import { useCallback, useEffect, useRef, useState } from "react";
import { fetchReleaseManifest } from "./fetch-release-manifest";
import { resolveInstalledAppVersion } from "./resolve-installed-version";
import {
  dismissUpdateVersion,
  getDismissedUpdateVersion,
  isUpdateSessionSnoozed,
  snoozeUpdateForSession,
} from "./update-preferences";
import type { UpdatePromptChoice } from "./AppUpdateModal";
import { isRemoteNewer } from "./version-compare";

export type UpdatePromptState = {
  localVersion: string;
  remoteVersion: string;
  apkUrl: string;
  notes?: string;
};

export type ManualCheckResult =
  | { kind: "upToDate"; localVersion: string }
  | { kind: "available"; prompt: UpdatePromptState }
  | { kind: "error"; message: string };

type Options = {
  /** Checagem automática ao montar (entrada no app autenticado). */
  autoCheck?: boolean;
};

export function useAppUpdateCheck(options: Options = {}) {
  const autoCheck = options.autoCheck !== false;
  const [prompt, setPrompt] = useState<UpdatePromptState | null>(null);
  const [toast, setToast] = useState<{
    kicker: string;
    message: string;
    tone: "ok" | "info" | "warn";
  } | null>(null);
  const checkingRef = useRef(false);

  const dismissToast = useCallback(() => setToast(null), []);

  const evaluateUpdate = useCallback(async (manual: boolean) => {
    if (checkingRef.current) {
      return { kind: "busy" as const };
    }
    checkingRef.current = true;
    try {
      const localVersion = resolveInstalledAppVersion();
      const manifest = await fetchReleaseManifest();

      if (!isRemoteNewer(localVersion, manifest.version)) {
        if (manual) {
          setToast({
            kicker: "Atualizações",
            message: `Você já está na versão mais recente (${localVersion}).`,
            tone: "ok",
          });
        }
        return {
          kind: "upToDate" as const,
          localVersion,
        };
      }

      const dismissed = await getDismissedUpdateVersion();
      if (
        !manual &&
        dismissed &&
        !isRemoteNewer(dismissed, manifest.version)
      ) {
        return { kind: "suppressed" as const };
      }

      if (!manual && isUpdateSessionSnoozed()) {
        return { kind: "snoozed" as const };
      }

      const nextPrompt: UpdatePromptState = {
        localVersion,
        remoteVersion: manifest.version,
        apkUrl: manifest.apkUrl,
        notes: manifest.notes,
      };
      setPrompt(nextPrompt);
      return { kind: "available" as const, prompt: nextPrompt };
    } catch {
      if (manual) {
        setToast({
          kicker: "Atualizações",
          message: "Não foi possível verificar agora. Tente de novo em instantes.",
          tone: "warn",
        });
      }
      return {
        kind: "error" as const,
        message: "Falha ao verificar atualização.",
      };
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!autoCheck) return;
    void evaluateUpdate(false);
  }, [autoCheck, evaluateUpdate]);

  const checkManually = useCallback(async (): Promise<ManualCheckResult> => {
    const result = await evaluateUpdate(true);
    if (result.kind === "upToDate") {
      return { kind: "upToDate", localVersion: result.localVersion };
    }
    if (result.kind === "available") {
      return { kind: "available", prompt: result.prompt };
    }
    return {
      kind: "error",
      message: "Não foi possível verificar agora.",
    };
  }, [evaluateUpdate]);

  const handleChoice = useCallback(
    async (choice: UpdatePromptChoice) => {
      const current = prompt;
      setPrompt(null);
      if (!current) return;

      if (choice === "later") {
        snoozeUpdateForSession();
        return;
      }

      if (choice === "dismiss") {
        await dismissUpdateVersion(current.remoteVersion);
      }
    },
    [prompt]
  );

  return {
    prompt,
    toast,
    dismissToast,
    checkManually,
    handleChoice,
  };
}
