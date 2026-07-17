"use client";

import { AlertBanner } from "@/components/ui/AlertBanner";
import { useAlertBanners } from "@/hooks/useAlertBanners";
import type { NotificationSnapshotItem } from "@/lib/types/notifications-api";

interface CalendarAlertBannerProps {
  /** Exibe botão para o calendário (uso fora dele, ex.: dashboard). */
  showCta?: boolean;
}

const URGENT_WINDOW_DAYS = 3;
const MS_PER_DAY = 86_400_000;

/** Datas dentro de 3 dias deixam o banner em tom de alerta (gold). */
function hasUrgentDate(items: NotificationSnapshotItem[]): boolean {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return items.some((item) => {
    if (!item.at) return false;
    const start = new Date(`${item.at}T12:00:00`).getTime();
    if (Number.isNaN(start)) return false;
    const days = Math.round((start - today.getTime()) / MS_PER_DAY);
    return days <= URGENT_WINDOW_DAYS;
  });
}

/** B37/F24 — banner de datas acadêmicas institucionais próximas (14 dias). */
export function CalendarAlertBanner({
  showCta = false,
}: CalendarAlertBannerProps) {
  const { calendar, loading } = useAlertBanners();

  if (loading || calendar.length === 0) return null;

  return (
    <div className="col-12">
      <AlertBanner
        tone={hasUrgentDate(calendar) ? "warning" : "info"}
        icon="calendar"
        title="Datas acadêmicas próximas"
        items={calendar}
        cta={showCta ? { href: "/calendario", label: "Ver calendário" } : undefined}
      />
    </div>
  );
}
