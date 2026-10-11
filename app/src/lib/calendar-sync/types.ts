export const CALENDAR_SYNC_CATEGORIES = [
  "aulas",
  "tarefas",
  "eventos",
  "academico",
] as const;

export type CalendarSyncCategory = (typeof CALENDAR_SYNC_CATEGORIES)[number];

export const CALENDAR_SYNC_REMINDER_MODES = [
  "padrao",
  "so_tarefas",
  "nenhum",
] as const;

/**
 * - padrao: aulas 15 min antes; tarefas/provas na véspera (18h) e no dia (8h); eventos 1 h antes.
 * - so_tarefas: só tarefas, provas e eventos criados pelo aluno.
 * - nenhum: sem alarmes (o app já notifica).
 */
export type CalendarSyncReminderMode = (typeof CALENDAR_SYNC_REMINDER_MODES)[number];

export interface CalendarSyncPreferences {
  categories: Record<CalendarSyncCategory, boolean>;
  reminders: CalendarSyncReminderMode;
}

export interface CalendarSyncSettingsView extends CalendarSyncPreferences {
  feed: {
    active: boolean;
    createdAt: string | null;
    lastAccessedAt: string | null;
  };
}

export interface CalendarFeedLinkView {
  /** https — "Adicionar por URL" no Google Agenda. */
  feedUrl: string;
  /** webcal:// — abre direto o app de agenda que assina feeds (iOS/desktop). */
  webcalUrl: string;
  settings: CalendarSyncSettingsView;
}

export interface PatchCalendarSyncSettingsBody {
  categories?: Partial<Record<CalendarSyncCategory, boolean>>;
  reminders?: CalendarSyncReminderMode;
}

export const DEFAULT_CALENDAR_SYNC_PREFERENCES: CalendarSyncPreferences = {
  categories: { aulas: true, tarefas: true, eventos: true, academico: true },
  reminders: "padrao",
};
