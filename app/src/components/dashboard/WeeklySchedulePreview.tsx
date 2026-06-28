"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WeeklyScheduleTable } from "@/components/schedule/WeeklyScheduleTable";
import { ScheduleTableSkeleton } from "@/components/schedule/ScheduleTableSkeleton";
import { useScheduleExtras } from "@/hooks/useScheduleExtras";

export function WeeklySchedulePreview() {
  const schedule = useScheduleExtras();

  if (schedule.loading) {
    return (
      <div className="card">
        <SectionHeader
          title="Grade da Semana"
          icon="calendar"
          href="/calendario"
          linkLabel="Ver calendário completo"
        />
        <ScheduleTableSkeleton />
      </div>
    );
  }

  if (schedule.needsSync) {
    return (
      <div className="card schedule-preview-state">
        <SectionHeader
          title="Grade da Semana"
          icon="calendar"
          href="/calendario"
          linkLabel="Ver calendário completo"
        />
        <p className="schedule-preview-message">
          Sincronize com o SIGAA para ver seus horários oficiais.
        </p>
        <Link href="/login" className="btn-outline schedule-preview-action">
          Ir para login
        </Link>
      </div>
    );
  }

  if (schedule.error) {
    return (
      <div className="card schedule-preview-state schedule-preview-state-error" role="alert">
        <SectionHeader title="Grade da Semana" icon="calendar" />
        <p className="schedule-preview-message">{schedule.error}</p>
        <button
          type="button"
          className="btn-outline schedule-preview-action"
          onClick={() => void schedule.refetch()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!schedule.hydrated) return null;

  return (
    <div className="card">
      <SectionHeader
        title="Grade da Semana"
        icon="calendar"
        href="/calendario"
        linkLabel="Ver calendário completo"
      />
      <WeeklyScheduleTable schedule={schedule.mergedSchedule} />
    </div>
  );
}
