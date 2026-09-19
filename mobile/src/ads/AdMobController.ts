import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAppOpenUnitId,
  getInterstitialUnitId,
  isAdMobConfigured,
  SYNC_INTERSTITIAL_COOLDOWN_MS,
} from "./ad-config";
import { readAdsFreeCache } from "./ads-free-store";

const LAST_SYNC_AD_KEY = "acme.hub.ads.lastSyncInterstitialAt";

type MobileAdsModule = {
  mobileAds: { initialize: () => Promise<unknown> };
  AppOpenAd: {
    createForAdRequest: (
      unitId: string,
      opts?: object
    ) => {
      load: () => void;
      show: () => void;
      addAdEventListener: (event: string, cb: () => void) => () => void;
      loaded: boolean;
    };
  };
  InterstitialAd: {
    createForAdRequest: (
      unitId: string,
      opts?: object
    ) => {
      load: () => void;
      show: () => void;
      addAdEventListener: (event: string, cb: () => void) => () => void;
      loaded: boolean;
    };
  };
  AdEventType: { LOADED: string; CLOSED: string; ERROR: string };
};

let adsModule: MobileAdsModule | null | undefined;
let initialized = false;
let sessionAppOpenShown = false;

async function loadModule(): Promise<MobileAdsModule | null> {
  if (adsModule !== undefined) return adsModule;
  try {
    // Pacote nativo — so existe apos prebuild/EAS com react-native-google-mobile-ads.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    adsModule = require("react-native-google-mobile-ads") as MobileAdsModule;
  } catch {
    adsModule = null;
  }
  return adsModule;
}

async function ensureInit(): Promise<MobileAdsModule | null> {
  if (!isAdMobConfigured()) return null;
  const mod = await loadModule();
  if (!mod) return null;
  if (!initialized) {
    await mod.mobileAds.initialize();
    initialized = true;
  }
  return mod;
}

async function shouldShowAds(): Promise<boolean> {
  const cache = await readAdsFreeCache();
  return !cache.active;
}

/**
 * App Open 1x por sessao (cold start / retomada longa).
 * Nao mostra se ads_free ativo ou SDK ausente.
 */
export async function maybeShowSessionAppOpen(): Promise<void> {
  if (sessionAppOpenShown) return;
  if (!(await shouldShowAds())) return;
  const mod = await ensureInit();
  if (!mod) return;

  sessionAppOpenShown = true;
  try {
    const ad = mod.AppOpenAd.createForAdRequest(getAppOpenUnitId());
    await new Promise<void>((resolve) => {
      const unsubLoaded = ad.addAdEventListener(mod.AdEventType.LOADED, () => {
        unsubLoaded();
        try {
          ad.show();
        } catch {
          /* ignore */
        }
        resolve();
      });
      const unsubErr = ad.addAdEventListener(mod.AdEventType.ERROR, () => {
        unsubErr();
        resolve();
      });
      ad.load();
      setTimeout(resolve, 2_000);
    });
  } catch {
    /* Expo Go / sem nativo */
  }
}

/**
 * Interstitial apos sync OK, com cooldown ~30 min.
 */
export async function maybeShowPostSyncInterstitial(): Promise<void> {
  if (!(await shouldShowAds())) return;
  const mod = await ensureInit();
  if (!mod) return;

  try {
    const raw = await AsyncStorage.getItem(LAST_SYNC_AD_KEY);
    const last = raw ? Number(raw) : 0;
    if (Number.isFinite(last) && Date.now() - last < SYNC_INTERSTITIAL_COOLDOWN_MS) {
      return;
    }

    const ad = mod.InterstitialAd.createForAdRequest(getInterstitialUnitId());
    await new Promise<void>((resolve) => {
      const unsubLoaded = ad.addAdEventListener(mod.AdEventType.LOADED, () => {
        unsubLoaded();
        try {
          ad.show();
          void AsyncStorage.setItem(LAST_SYNC_AD_KEY, String(Date.now()));
        } catch {
          /* ignore */
        }
        resolve();
      });
      const unsubErr = ad.addAdEventListener(mod.AdEventType.ERROR, () => {
        unsubErr();
        resolve();
      });
      ad.load();
      setTimeout(resolve, 2_000);
    });
  } catch {
    /* ignore */
  }
}
