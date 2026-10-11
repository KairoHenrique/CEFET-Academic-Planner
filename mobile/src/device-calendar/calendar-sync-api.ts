import type {
  CalendarFeedLink,
  CalendarSyncCategory,
  CalendarSyncItemsResponse,
  CalendarSyncReminderMode,
  CalendarSyncSettings,
} from "@acme/api-contracts";
import { requestJson } from "../auth/api";

export function fetchCalendarSyncSettings(): Promise<CalendarSyncSettings> {
  return requestJson<CalendarSyncSettings>("/api/calendar-sync/settings");
}

export function patchCalendarSyncSettings(patch: {
  categories?: Partial<Record<CalendarSyncCategory, boolean>>;
  reminders?: CalendarSyncReminderMode;
}): Promise<CalendarSyncSettings> {
  return requestJson<CalendarSyncSettings>("/api/calendar-sync/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export function createCalendarFeedLink(): Promise<CalendarFeedLink> {
  return requestJson<CalendarFeedLink>("/api/calendar-sync/feed-token", { method: "POST" });
}

export function revokeCalendarFeedLink(): Promise<CalendarSyncSettings> {
  return requestJson<CalendarSyncSettings>("/api/calendar-sync/feed-token", { method: "DELETE" });
}

export function fetchCalendarSyncItems(): Promise<CalendarSyncItemsResponse> {
  return requestJson<CalendarSyncItemsResponse>("/api/calendar-sync/items");
}
