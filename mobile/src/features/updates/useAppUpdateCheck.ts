import { useCallback, useState } from "react";
import { Linking } from "react-native";
import { resolveInstalledAppVersion } from "./resolve-installed-version";
import type { UpdatePromptChoice } from "./AppUpdateModal";

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
  autoCheck?: boolean;
};

export function useAppUpdateCheck(options: Options = {}) {
  const [prompt, setPrompt] = useState<UpdatePromptState | null>(null);
  const [toast, setToast] = useState<{
    kicker: string;
    message: string;
    tone: "ok" | "info" | "warn";
  } | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const checkManually = useCallback(async (): Promise<ManualCheckResult> => {
    try {
      await Linking.openURL("market://details?id=br.cefethub.acme");
    } catch {
      try {
        await Linking.openURL("https://play.google.com/store/apps/details?id=br.cefethub.acme");
      } catch {
        setToast({
          kicker: "Atualizações",
          message: "Não foi possível abrir a Play Store.",
          tone: "warn",
        });
        return { kind: "error", message: "Não foi possível abrir a Play Store." };
      }
    }
    return { kind: "upToDate", localVersion: resolveInstalledAppVersion() };
  }, []);

  const handleChoice = useCallback(
    async (choice: UpdatePromptChoice) => {
      setPrompt(null);
    },
    []
  );

  return {
    prompt,
    toast,
    dismissToast,
    checkManually,
    handleChoice,
  };
}
