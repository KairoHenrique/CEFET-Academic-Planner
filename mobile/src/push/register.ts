import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { requestJson } from "../auth/api";
import { getSession, isAuthenticated } from "../auth/session";
import { ANDROID_PUSH_CHANNEL_ID, setupPushNotifications } from "./setup";

const TOKEN_KEY = "acme-hub.push.token";

/**
 * Expo Go (SDK 53+) não entrega remote push no Android.
 * APK / EAS Build / dev client → appOwnership !== "expo".
 */
export function isExpoGoRuntime(): boolean {
  return (
    Constants.appOwnership === "expo" ||
    Constants.executionEnvironment === "storeClient"
  );
}

function resolveEasProjectId(): string | null {
  const fromEas =
    Constants.easConfig?.projectId ??
    (
      Constants.expoConfig?.extra as
        | { eas?: { projectId?: string } }
        | undefined
    )?.eas?.projectId;
  if (typeof fromEas === "string" && fromEas.trim()) return fromEas.trim();
  return null;
}

async function getExpoPushTokenAsync(): Promise<string | null> {
  if (isExpoGoRuntime()) {
    if (__DEV__) {
      console.info(
        "[push] Expo Go — remote push desligado; use APK/EAS Build."
      );
    }
    return null;
  }
  if (!Device.isDevice || Platform.OS !== "android") {
    return null;
  }

  await setupPushNotifications();

  const Notifications = await import("expo-notifications");

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    if (__DEV__) console.warn("[push] Permissão de notificação negada.");
    return null;
  }

  const projectId = resolveEasProjectId();
  if (!projectId) {
    console.warn(
      "[push] Falta extra.eas.projectId (rode `eas init` no mobile/). Token não obtido."
    );
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

/** Registra o aparelho no backend — só APK/dev client logado com assinatura ativa. */
export async function registerPushForCurrentSession(): Promise<boolean> {
  if (!isAuthenticated() || isExpoGoRuntime()) return false;

  try {
    const expoPushToken = await getExpoPushTokenAsync();
    if (!expoPushToken) return false;

    await requestJson("/api/push/register", {
      method: "POST",
      body: JSON.stringify({ expoPushToken, platform: "android" }),
    });

    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(TOKEN_KEY, expoPushToken);
    if (__DEV__) console.info("[push] Token registrado no backend.");
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        "[push] Falha ao registrar:",
        error instanceof Error ? error.message : error
      );
    }
    return false;
  }
}

export async function unregisterPushForCurrentSession(): Promise<void> {
  if (isExpoGoRuntime()) return;
  try {
    const SecureStore = await import("expo-secure-store");
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token && getSession()) {
      await requestJson("/api/push/register", {
        method: "DELETE",
        body: JSON.stringify({ expoPushToken: token, platform: "android" }),
      }).catch(() => undefined);
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
  } catch {
    // ignore
  }
}

export { ANDROID_PUSH_CHANNEL_ID, setupPushNotifications };
