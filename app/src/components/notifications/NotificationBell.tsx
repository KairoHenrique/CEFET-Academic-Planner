"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatGradePoints } from "@/lib/disciplinas/grade-input";
import {
  GRADE_SCORE_GOLD,
  resolveGradeScorePercentColor,
} from "@/lib/disciplinas/grade-display";
import { Icon } from "@/components/ui/Icon";
import {
  isUrgentCalendarReminderFingerprint,
  isUrgentTaskReminderFingerprint,
} from "@/lib/notifications/notification-fingerprint";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationSnapshotItem } from "@/lib/types/notifications-api";

function formatDueDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function countByKind(items: NotificationSnapshotItem[]) {
  const newTasks = items.filter(
    (item) => item.kind === "task" || item.kind === "task-reminder"
  ).length;
  const newGrades = items.filter((item) => item.kind === "grade").length;
  const newCalendarEvents = items.filter(
    (item) =>
      item.kind === "calendar-event-reminder" || item.kind === "class-reminder"
  ).length;
  return { newTasks, newGrades, newCalendarEvents };
}

function iconForNotification(item: NotificationSnapshotItem) {
  if (item.kind === "grade") return "star" as const;
  if (item.kind === "class-reminder") return "books" as const;
  if (item.kind === "calendar-event-reminder") {
    return isUrgentCalendarReminderFingerprint(item.fingerprint)
      ? ("priority-high" as const)
      : ("calendar" as const);
  }
  if (item.kind === "task-reminder") {
    return isUrgentTaskReminderFingerprint(item.fingerprint)
      ? ("priority-high" as const)
      : ("clipboard" as const);
  }
  return "clipboard" as const;
}

function kindClassName(item: NotificationSnapshotItem): string {
  if (item.kind === "class-reminder") {
    return "notification-bell-kind notification-bell-kind--class-reminder";
  }
  if (
    item.kind === "calendar-event-reminder" &&
    isUrgentCalendarReminderFingerprint(item.fingerprint)
  ) {
    return "notification-bell-kind notification-bell-kind--calendar-event-reminder-urgent";
  }
  if (item.kind === "calendar-event-reminder") {
    return "notification-bell-kind notification-bell-kind--calendar-event-reminder";
  }
  if (item.kind === "task-reminder" && isUrgentTaskReminderFingerprint(item.fingerprint)) {
    return "notification-bell-kind notification-bell-kind--task-reminder-urgent";
  }
  if (item.kind === "task-reminder") {
    return "notification-bell-kind notification-bell-kind--task-reminder";
  }
  return `notification-bell-kind notification-bell-kind--${item.kind}`;
}

function renderGradeSubtitle(item: NotificationSnapshotItem) {
  if (item.notaObtida === undefined) {
    return <span className="notification-bell-item-subtitle">{item.subtitle}</span>;
  }

  const obtida = formatGradePoints(item.notaObtida);
  const disciplinaNome = item.disciplinaNome ?? item.subtitle;
  const maxPoints = item.notaMaxima;
  const hasMax =
    maxPoints !== null &&
    maxPoints !== undefined &&
    maxPoints > 0;

  const obtainedColor = hasMax
    ? resolveGradeScorePercentColor(item.notaObtida, maxPoints)
    : GRADE_SCORE_GOLD;

  return (
    <span className="notification-bell-item-subtitle">
      {disciplinaNome} ·{" "}
      <span className="notification-bell-grade-line">
        Nota{" "}
        <strong
          className="notification-bell-grade-obtained"
          style={{ color: obtainedColor }}
        >
          {obtida}
        </strong>
        {hasMax && (
          <>
            <strong className="notification-bell-grade-sep">/</strong>
            <strong className="notification-bell-grade-max">
              {formatGradePoints(maxPoints)}
            </strong>
          </>
        )}
      </span>
    </span>
  );
}

function mergePanelItems(
  unread: NotificationSnapshotItem[],
  recent: NotificationSnapshotItem[]
): NotificationSnapshotItem[] {
  const seen = new Set<string>();
  const merged: NotificationSnapshotItem[] = [];

  for (const item of [...unread, ...recent]) {
    if (seen.has(item.fingerprint)) continue;
    seen.add(item.fingerprint);
    merged.push(item);
  }

  return merged;
}

export function NotificationBell() {
  const {
    unread,
    totalUnread,
    loading,
    error,
    markItemsAsRead,
    getRecentPanelItems,
    archiveSeenItems,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [panelItems, setPanelItems] = useState<NotificationSnapshotItem[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const panelCounts = countByKind(panelItems);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open) {
      const recent = getRecentPanelItems();
      const items = mergePanelItems(unread, recent);
      setPanelItems(items);

      if (unread.length > 0) {
        archiveSeenItems(unread);
        markItemsAsRead(unread.map((item) => item.fingerprint));
      }

      setOpen(true);
      return;
    }
    setOpen(false);
  };

  const handleItemClick = () => {
    setOpen(false);
  };

  const badgeLabel =
    totalUnread > 9 ? "9+" : totalUnread > 0 ? String(totalUnread) : undefined;

  return (
    <div className="notification-bell-root" ref={rootRef}>
      <button
        type="button"
        className="notification-bell-btn"
        data-tutorial-id="notifications-bell"
        onClick={handleToggle}
        aria-label={
          totalUnread > 0
            ? `${totalUnread} novidades no app`
            : "Notificações"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Icon name="bell" size={15} />
        {badgeLabel && (
          <span className="notification-bell-badge" aria-hidden="true">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          className="notification-bell-panel"
          role="dialog"
          aria-label="Notificações recentes"
        >
          <header className="notification-bell-header">
            <h2 className="notification-bell-title">Novidades</h2>
            {panelItems.length > 0 && (
              <p className="notification-bell-summary">
                {panelCounts.newTasks > 0 && (
                  <span>
                    {panelCounts.newTasks} tarefa
                    {panelCounts.newTasks === 1 ? "" : "s"}
                  </span>
                )}
                {panelCounts.newTasks > 0 &&
                  (panelCounts.newGrades > 0 || panelCounts.newCalendarEvents > 0) &&
                  " · "}
                {panelCounts.newGrades > 0 && (
                  <span>
                    {panelCounts.newGrades} nota
                    {panelCounts.newGrades === 1 ? "" : "s"}
                  </span>
                )}
                {panelCounts.newGrades > 0 && panelCounts.newCalendarEvents > 0 && " · "}
                {panelCounts.newCalendarEvents > 0 && (
                  <span>
                    {panelCounts.newCalendarEvents} evento
                    {panelCounts.newCalendarEvents === 1 ? "" : "s"}
                  </span>
                )}
              </p>
            )}
          </header>

          {loading && <p className="notification-bell-empty">Carregando…</p>}

          {!loading && error && (
            <p className="notification-bell-empty" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && panelItems.length === 0 && (
            <p className="notification-bell-empty">
              Nenhuma novidade nas últimas 24 horas.
            </p>
          )}

          {!loading && !error && panelItems.length > 0 && (
            <ul className="notification-bell-list">
              {panelItems.map((item) => (
                <li key={item.fingerprint}>
                  <Link
                    href={item.href}
                    className="notification-bell-item"
                    onClick={handleItemClick}
                  >
                    <span className={kindClassName(item)}>
                      <Icon name={iconForNotification(item)} size={14} />
                    </span>
                    <span className="notification-bell-copy">
                      <span className="notification-bell-item-title">
                        {item.title}
                      </span>
                      {item.kind === "grade" ? (
                        renderGradeSubtitle(item)
                      ) : (
                        <span className="notification-bell-item-subtitle">
                          {item.subtitle}
                          {item.kind === "task" && formatDueDate(item.at) && (
                            <> · {formatDueDate(item.at)}</>
                          )}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
