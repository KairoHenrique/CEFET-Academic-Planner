import { SectionHeader } from "@/components/ui/SectionHeader";
import { WeeklyScheduleTable } from "@/components/schedule/WeeklyScheduleTable";

export function WeeklySchedulePreview() {
  return (
    <div className="card">
      <SectionHeader
        title="Grade da Semana"
        icon="calendar"
        href="/calendario"
        linkLabel="Ver calendário completo"
      />
      <WeeklyScheduleTable />
    </div>
  );
}
