/**
 * Canal Android + handler — obrigatório no APK (Android 8+).
 * Expo Go não carrega este módulo no caminho de push remoto.
 */

export const ANDROID_PUSH_CHANNEL_ID = "acme-hub-default";

export async function setupPushNotifications(): Promise<void> {
  const Constants = await import("expo-constants");
  if (Constants.default.appOwnership === "expo") return;

  const Device = await import("expo-device");
  const { Platform } = await import("react-native");
  if (!Device.isDevice || Platform.OS !== "android") return;

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

  await Notifications.setNotificationChannelAsync(ANDROID_PUSH_CHANNEL_ID, {
    name: "ACME HUB",
    description: "Avisos acadêmicos e sincronização SIGAA",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#C9A227",
    sound: "default",
    enableVibrate: true,
    showBadge: true,
  });
}
