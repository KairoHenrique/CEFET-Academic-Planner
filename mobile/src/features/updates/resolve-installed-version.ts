import Constants from "expo-constants";
import { Platform } from "react-native";

/** Versão instalada no aparelho (expo.config → native). */
export function resolveInstalledAppVersion(): string {
  const fromExpo =
    Constants.expoConfig?.version?.trim() ||
    Constants.nativeAppVersion?.trim() ||
    "";
  if (fromExpo) return fromExpo;

  if (Platform.OS === "android") {
    const android = Constants.expoConfig?.android as
      | { versionCode?: number }
      | undefined;
    if (android?.versionCode) return String(android.versionCode);
  }

  return "0.0.0";
}
