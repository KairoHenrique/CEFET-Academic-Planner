"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { WeeklyScheduleTable } from "@/components/schedule/WeeklyScheduleTable";
import { useScheduleExtras } from "@/hooks/useScheduleExtras";

export function WeeklySchedulePreview() {
  const schedule = useScheduleExtras();
  if (!schedule.hydrated) return null;

  return (
    <div className="card">
      <SectionHeader title="Grade da Semana" icon="calendar" href="/calendario" linkLabel="Ver calendário completo" />
      <WeeklyScheduleTable schedule={schedule.mergedSchedule} />
    </div>
  );
}
