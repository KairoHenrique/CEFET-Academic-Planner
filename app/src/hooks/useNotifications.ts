"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications, SYNC_COMPLETE_EVENT } from "@/lib/api/client";
import {
  mergeNotificationBaseline,
  readNotificationBaseline,
  seedNotificationBaselineIfMissing,
} from "@/lib/notifications/notification-baseline";
import {
  archiveRecentPanelItems,
  readRecentPanelItems,
} from "@/lib/notifications/notification-recent-panel";
import { buildTaskDeadlineReminderItems } from "@/lib/notifications/task-deadline-reminders";
import { queryKeys } from "@/lib/query/keys";
import type { NotificationSnapshotItem } from "@/lib/types/notifications-api";

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

  useEffect(() => {
    if (!query.data?.items) return;
    seedNotificationBaselineIfMissing(
      query.data.items.map((item) => item.fingerprint)
    );
  }, [query.data?.items]);

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

    const reminderItems = buildTaskDeadlineReminderItems(
      query.data.pendingTasks ?? [],
      new Date()
    );

    return mergeNotificationItems(query.data.items, reminderItems);
  }, [query.data, reminderTick]);

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

  return {
    unread,
    totalUnread: unread.length,
    newTasks,
    newGrades,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    markItemsAsRead,
    getRecentPanelItems,
    archiveSeenItems,
    refetch: query.refetch,
  };
}
