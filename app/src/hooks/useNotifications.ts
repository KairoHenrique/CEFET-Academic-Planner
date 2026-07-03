"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications, SYNC_COMPLETE_EVENT } from "@/lib/api/client";
import {
  initializeNotificationBaselineFromPreSync,
  mergeNotificationBaseline,
  migrateLegacyNotificationBaseline,
  readNotificationBaseline,
  seedNotificationBaselineIfMissing,
} from "@/lib/notifications/notification-baseline";
import {
  buildCalendarEventReminderItems,
  buildClassSessionReminderItems,
} from "@/lib/notifications/calendar-event-reminder-items";
import {
  buildCalendarEventReminderFingerprint,
  buildClassReminderFingerprint,
  buildTaskReminderNotificationFingerprint,
} from "@/lib/notifications/notification-fingerprint";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  isNotificationKindEnabled,
} from "@/lib/notifications/notification-preferences-shared";
import { consumePreSyncNotificationBaseline } from "@/lib/notifications/notification-pre-sync-baseline";
import {
  archiveRecentPanelItems,
  readRecentPanelItems,
} from "@/lib/notifications/notification-recent-panel";
import { buildTaskDeadlineReminderItems } from "@/lib/notifications/task-deadline-reminders";
import { queryKeys } from "@/lib/query/keys";
import type { NotificationSnapshotItem } from "@/lib/types/notifications-api";
import type { NotificationPreferences } from "@/lib/types/perfil-api";

const REMINDER_TICK_MS = 60_000;

async function fetchNotificationSnapshot() {
  return getNotifications();
}

function filterUnread(
  items: NotificationSnapshotItem[],
  baseline: Set<string> | null
): NotificationSnapshotItem[] {
  if (!baseline) return [];
  return items.filter((item) => !baseline.has(item.fingerprint));
}

function filterByPreferences(
  items: NotificationSnapshotItem[],
  preferences: NotificationPreferences
): NotificationSnapshotItem[] {
  return items.filter((item) => isNotificationKindEnabled(item.kind, preferences));
}

function mergeNotificationItems(
  syncItems: NotificationSnapshotItem[],
  reminderItems: NotificationSnapshotItem[]
): NotificationSnapshotItem[] {
  const seen = new Set<string>();
  const merged: NotificationSnapshotItem[] = [];

  for (const item of [...reminderItems, ...syncItems]) {
    if (seen.has(item.fingerprint)) continue;
    seen.add(item.fingerprint);
    merged.push(item);
  }

  return merged;
}

function extractReminderTaskTitle(subtitle: string): string | null {
  const match = subtitle.match(/:\s*(.+?)\s·\s/);
  return match?.[1]?.trim().toLowerCase() ?? null;
}

/** Evita tarefa nova + lembrete de prazo para a mesma entrega. */
function dedupeTaskNotificationItems(
  items: NotificationSnapshotItem[],
  reminderItems: NotificationSnapshotItem[]
): NotificationSnapshotItem[] {
  if (reminderItems.length === 0) return items;

  const remindedDeliveries = new Set(
    reminderItems
      .filter((item) => item.kind === "task-reminder")
      .map((item) => {
        const title = extractReminderTaskTitle(item.subtitle);
        return title ? `${item.href}|${title}` : item.href;
      })
  );

  return items.filter((item) => {
    if (item.kind !== "task") return true;
    const key = `${item.href}|${item.title.trim().toLowerCase()}`;
    return !remindedDeliveries.has(key);
  });
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const [baselineVersion, setBaselineVersion] = useState(0);
  const [reminderTick, setReminderTick] = useState(0);

  const query = useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: fetchNotificationSnapshot,
    staleTime: 60_000,
    retry: 1,
  });

  const preferences =
    query.data?.preferences ?? DEFAULT_NOTIFICATION_PREFERENCES;

  useEffect(() => {
    if (!query.data?.items) return;

    const preSync = consumePreSyncNotificationBaseline();
    if (preSync !== null) {
      if (initializeNotificationBaselineFromPreSync(preSync)) {
        setBaselineVersion((value) => value + 1);
      }
    }

    const stableFingerprints = [
      ...query.data.items.map((item) => item.fingerprint),
      ...(query.data.pendingTasks ?? []).flatMap((task) =>
        (["24h", "1h"] as const).map((slot) =>
          buildTaskReminderNotificationFingerprint(
            task.disciplinaId,
            task.title,
            task.dueDateIso,
            slot
          )
        )
      ),
      ...(query.data.pendingCalendarEvents ?? []).flatMap((event) =>
        (["24h", "1h"] as const).map((slot) =>
          buildCalendarEventReminderFingerprint(
            event.eventId,
            event.startDateIso,
            slot
          )
        )
      ),
      ...(query.data.pendingClassSessions ?? []).map((session) =>
        buildClassReminderFingerprint(session.eventId, session.startDateIso)
      ),
    ];

    if (migrateLegacyNotificationBaseline(stableFingerprints)) {
      setBaselineVersion((value) => value + 1);
    } else if (preSync === null) {
      seedNotificationBaselineIfMissing(stableFingerprints);
    }
  }, [
    query.data?.items,
    query.data?.pendingTasks,
    query.data?.pendingCalendarEvents,
    query.data?.pendingClassSessions,
  ]);

  useEffect(() => {
    const onSyncComplete = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    };
    window.addEventListener(SYNC_COMPLETE_EVENT, onSyncComplete);
    return () => window.removeEventListener(SYNC_COMPLETE_EVENT, onSyncComplete);
  }, [queryClient]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setReminderTick((value) => value + 1);
    }, REMINDER_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const allItems = useMemo(() => {
    void reminderTick;
    if (!query.data) return [];

    const now = new Date();
    const taskReminders = preferences.taskReminders
      ? buildTaskDeadlineReminderItems(query.data.pendingTasks ?? [], now)
      : [];
    const calendarReminders = preferences.calendarReminders
      ? buildCalendarEventReminderItems(
          query.data.pendingCalendarEvents ?? [],
          now
        )
      : [];
    const classReminders = preferences.classReminders
      ? buildClassSessionReminderItems(
          query.data.pendingClassSessions ?? [],
          now
        )
      : [];

    const reminderItems = [
      ...taskReminders,
      ...calendarReminders,
      ...classReminders,
    ];

    return filterByPreferences(
      dedupeTaskNotificationItems(
        mergeNotificationItems(query.data.items, reminderItems),
        taskReminders
      ),
      preferences
    );
  }, [query.data, reminderTick, preferences]);

  const unread = useMemo(() => {
    void baselineVersion;
    return filterUnread(allItems, readNotificationBaseline());
  }, [allItems, baselineVersion]);

  const markItemsAsRead = useCallback((fingerprints: string[]) => {
    if (fingerprints.length === 0) return;
    mergeNotificationBaseline(fingerprints);
    setBaselineVersion((value) => value + 1);
  }, []);

  const getRecentPanelItems = useCallback(() => {
    void baselineVersion;
    return readRecentPanelItems();
  }, [baselineVersion]);

  const archiveSeenItems = useCallback((items: NotificationSnapshotItem[]) => {
    archiveRecentPanelItems(items);
    setBaselineVersion((value) => value + 1);
  }, []);

  const newTasks = unread.filter(
    (item) => item.kind === "task" || item.kind === "task-reminder"
  ).length;
  const newGrades = unread.filter((item) => item.kind === "grade").length;
  const newCalendarEvents = unread.filter(
    (item) =>
      item.kind === "calendar-event-reminder" || item.kind === "class-reminder"
  ).length;

  return {
    unread,
    totalUnread: unread.length,
    newTasks,
    newGrades,
    newCalendarEvents,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    markItemsAsRead,
    getRecentPanelItems,
    archiveSeenItems,
    refetch: query.refetch,
  };
}
