import { useCallback, useEffect, useState } from "react";
import { Alert, Linking } from "react-native";
import * as Clipboard from "expo-clipboard";
import type {
  CalendarFeedLink,
  CalendarSyncCategory,
  CalendarSyncReminderMode,
  CalendarSyncSettings,
} from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import {
  createCalendarFeedLink,
  fetchCalendarSyncSettings,
  patchCalendarSyncSettings,
  revokeCalendarFeedLink,
} from "./calendar-sync-api";
import { readDeviceCalendarState } from "./device-calendar-store";
import {
  disableDeviceCalendarSync,
  enableDeviceCalendarSync,
  syncDeviceCalendar,
  type DeviceCalendarSyncResult,
} from "./sync-device-calendar";

export const GOOGLE_CALENDAR_ADD_BY_URL = "https://calendar.google.com/calendar/u/0/r/settings/addbyurl";

function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

function describeDeviceResult(result: DeviceCalendarSyncResult): string {
  switch (result.status) {
    case "synced":
      return `Agenda do celular atualizada (${result.total} itens em ${result.calendars} agendas).`;
    case "permission_denied":
      return "Permissão de agenda negada. Libere em Configurações > Apps > ACME HUB > Permissões.";
    case "unsupported":
      return "Agenda do aparelho disponível só no Android.";
    default:
      return "Agenda do celular sem alterações.";
  }
}

export function useCalendarSyncSettings() {
  const [settings, setSettings] = useState<CalendarSyncSettings | null>(null);
  const [deviceEnabled, setDeviceEnabled] = useState(false);
  const [lastDeviceSyncAt, setLastDeviceSyncAt] = useState<number | null>(null);
  const [feedLink, setFeedLink] = useState<CalendarFeedLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshDeviceState = useCallback(async () => {
    const state = await readDeviceCalendarState();
    setDeviceEnabled(state.enabled);
    setLastDeviceSyncAt(state.lastSyncedAt);
  }, []);

  useEffect(() => {
    void fetchCalendarSyncSettings()
      .then(setSettings)
      .catch((error) => setMessage(errorText(error, "Não foi possível carregar a agenda.")));
    void refreshDeviceState();
  }, [refreshDeviceState]);

  const runBusy = useCallback(async (task: () => Promise<string | null>, fallback: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const text = await task();
      if (text) setMessage(text);
    } catch (error) {
      setMessage(errorText(error, fallback));
    } finally {
      setBusy(false);
      void refreshDeviceState();
    }
  }, [refreshDeviceState]);

  const resyncDeviceIfEnabled = useCallback(async (): Promise<string> => {
    if (!deviceEnabled) return "Preferências da agenda salvas.";
    return describeDeviceResult(await syncDeviceCalendar({ force: true }));
  }, [deviceEnabled]);

  const toggleCategory = (category: CalendarSyncCategory, value: boolean) =>
    runBusy(async () => {
      setSettings(await patchCalendarSyncSettings({ categories: { [category]: value } }));
      return resyncDeviceIfEnabled();
    }, "Falha ao salvar preferências da agenda.");

  const setReminderMode = (reminders: CalendarSyncReminderMode) =>
    runBusy(async () => {
      setSettings(await patchCalendarSyncSettings({ reminders }));
      return resyncDeviceIfEnabled();
    }, "Falha ao salvar lembretes.");

  const toggleDevice = (value: boolean) =>
    runBusy(async () => {
      if (!value) {
        await disableDeviceCalendarSync();
        return "Agendas ACME HUB removidas do celular.";
      }
      const result = await enableDeviceCalendarSync();
      if (result.status === "permission_denied") {
        Alert.alert("Permissão necessária", describeDeviceResult(result), [
          { text: "Agora não", style: "cancel" },
          { text: "Abrir configurações", onPress: () => void Linking.openSettings() },
        ]);
      }
      return describeDeviceResult(result);
    }, "Falha ao sincronizar a agenda do celular.");

  const syncDeviceNow = () =>
    runBusy(
      async () => describeDeviceResult(await syncDeviceCalendar({ force: true, prompt: true })),
      "Falha ao sincronizar a agenda do celular."
    );

  const generateFeedLink = () =>
    runBusy(async () => {
      const link = await createCalendarFeedLink();
      setFeedLink(link);
      setSettings(link.settings);
      return "Link gerado. Copie e adicione no Google Agenda.";
    }, "Falha ao gerar o link.");

  const revokeFeedLink = () =>
    runBusy(async () => {
      setSettings(await revokeCalendarFeedLink());
      setFeedLink(null);
      return "Link revogado. Agendas que usavam ele param de atualizar.";
    }, "Falha ao revogar o link.");

  const copyFeedLink = async () => {
    if (!feedLink) return;
    await Clipboard.setStringAsync(feedLink.feedUrl);
    setMessage("Link copiado.");
  };

  return {
    settings,
    deviceEnabled,
    lastDeviceSyncAt,
    feedLink,
    busy,
    message,
    toggleCategory,
    setReminderMode,
    toggleDevice,
    syncDeviceNow,
    generateFeedLink,
    revokeFeedLink,
    copyFeedLink,
  };
}
