import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { requestJson } from "../auth/api";
import { getSession, isAuthenticated } from "../auth/session";

const TOKEN_KEY = "acme-hub.push.token";

/** Expo Go (SDK 53+) não suporta remote push no Android — só development build. */
function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

async function getExpoPushTokenAsync(): Promise<string | null> {
  if (isExpoGo()) {
    return null;
  }
  if (!Device.isDevice || Platform.OS !== "android") {
    return null;
  }

  const Notifications = await import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export async function registerPushForCurrentSession(): Promise<boolean> {
  if (!isAuthenticated() || isExpoGo()) return false;

  try {
    const expoPushToken = await getExpoPushTokenAsync();
    if (!expoPushToken) return false;

    await requestJson("/api/push/register", {
      method: "POST",
      body: JSON.stringify({ expoPushToken, platform: "android" }),
    });

    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(TOKEN_KEY, expoPushToken);
    return true;
  } catch {
    return false;
  }
}

export async function unregisterPushForCurrentSession(): Promise<void> {
  if (isExpoGo()) return;
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
