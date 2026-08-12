import { navigateFromNotificationHref } from "../navigation/resolve-notification-href";

type PushData = {
  href?: string;
  type?: string;
  fingerprint?: string;
};

function readHref(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const href = (data as PushData).href;
  return typeof href === "string" && href.trim() ? href.trim() : null;
}

/**
 * Registra listener de toque em push + cold start (app aberto pela notificação).
 */
export function setupNotificationNavigationListeners(): () => void {
  let cancelled = false;
  let removeListener: (() => void) | undefined;

  void (async () => {
    try {
      const Constants = await import("expo-constants");
      if (Constants.default.appOwnership === "expo") return;

      const Notifications = await import("expo-notifications");
      if (cancelled) return;

      const last = await Notifications.getLastNotificationResponseAsync();
      const lastHref = readHref(last?.notification.request.content.data);
      if (lastHref) {
        setTimeout(() => navigateFromNotificationHref(lastHref), 400);
      }

      removeListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const href = readHref(response.notification.request.content.data);
          if (href) navigateFromNotificationHref(href);
        }
      ).remove;
    } catch {
      /* Expo Go / web */
    }
  })();

  return () => {
    cancelled = true;
    removeListener?.();
  };
}

export { navigateFromNotificationHref };
