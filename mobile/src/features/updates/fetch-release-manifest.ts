import { getApiBaseUrl } from "../../config/env";

export type ReleaseManifest = {
  version: string;
  apkUrl: string;
  notes?: string;
  label?: string;
  published?: boolean;
};

export async function fetchReleaseManifest(
  signal?: AbortSignal
): Promise<ReleaseManifest> {
  const url = `${getApiBaseUrl()}/releases/manifest.json`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Manifest HTTP ${response.status}`);
  }

  const raw = (await response.json()) as Partial<ReleaseManifest>;
  const version = typeof raw.version === "string" ? raw.version.trim() : "";
  const apkUrl = typeof raw.apkUrl === "string" ? raw.apkUrl.trim() : "";

  if (!version || !apkUrl) {
    throw new Error("Manifest de release inválido.");
  }

  if (raw.published === false) {
    throw new Error("Release não publicada.");
  }

  return {
    version,
    apkUrl,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
    label: typeof raw.label === "string" ? raw.label : undefined,
    published: true,
  };
}
