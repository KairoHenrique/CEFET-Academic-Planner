import Constants from "expo-constants";

/** IDs de teste Google — trocar por IDs reais no EAS / Play go-live. */
const TEST_APP_OPEN = "ca-app-pub-3940256099942544/9257395921";
const TEST_INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712";

type Extra = {
  admobAppOpenUnitId?: string;
  admobInterstitialUnitId?: string;
  admobEnabled?: boolean;
};

function extra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra;
}

export function isAdMobConfigured(): boolean {
  const e = extra();
  if (e.admobEnabled === false) return false;
  return true;
}

export function getAppOpenUnitId(): string {
  return extra().admobAppOpenUnitId?.trim() || TEST_APP_OPEN;
}

export function getInterstitialUnitId(): string {
  return extra().admobInterstitialUnitId?.trim() || TEST_INTERSTITIAL;
}

/** Cooldown entre interstitials pos-sync (~30 min). */
export const SYNC_INTERSTITIAL_COOLDOWN_MS = 30 * 60 * 1000;
