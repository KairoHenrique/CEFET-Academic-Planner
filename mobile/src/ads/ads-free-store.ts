import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "acme.hub.adsFree";

export type AdsFreeCache = {
  active: boolean;
  expiresAt: string | null;
};

export async function readAdsFreeCache(): Promise<AdsFreeCache> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { active: false, expiresAt: null };
    const parsed = JSON.parse(raw) as AdsFreeCache;
    if (parsed.active && parsed.expiresAt) {
      if (Date.parse(parsed.expiresAt) <= Date.now()) {
        return { active: false, expiresAt: parsed.expiresAt };
      }
    }
    return {
      active: Boolean(parsed.active),
      expiresAt: parsed.expiresAt ?? null,
    };
  } catch {
    return { active: false, expiresAt: null };
  }
}

export async function writeAdsFreeCache(value: AdsFreeCache): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(value));
}
