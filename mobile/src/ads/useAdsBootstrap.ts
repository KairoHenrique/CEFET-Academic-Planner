import { useEffect } from "react";
import { AppState, InteractionManager, type AppStateStatus } from "react-native";
import { maybeShowSessionAppOpen } from "./AdMobController";
import { refreshAdsFreeFromServer } from "./refresh-ads-free";

const ADS_BOOT_DELAY_MS = 2500;

/**
 * Bootstrap ads apos a 1a frame + delay — nao atrasa abertura do app.
 */
export function useAdsBootstrap(): void {
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const task = InteractionManager.runAfterInteractions(() => {
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        void refreshAdsFreeFromServer().finally(() => {
          if (!cancelled) void maybeShowSessionAppOpen();
        });
      }, ADS_BOOT_DELAY_MS);
    });

    let lastBackground = 0;
    const onChange = (state: AppStateStatus) => {
      if (state === "background" || state === "inactive") {
        lastBackground = Date.now();
        return;
      }
      if (state === "active" && lastBackground > 0) {
        if (Date.now() - lastBackground > 30 * 60 * 1000) {
          void maybeShowSessionAppOpen();
        }
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => {
      cancelled = true;
      task.cancel();
      if (timeoutId) clearTimeout(timeoutId);
      sub.remove();
    };
  }, []);
}
