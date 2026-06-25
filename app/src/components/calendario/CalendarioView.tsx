"use client";

import { useState } from "react";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { CalendarMonth, CalendarEventsList } from "@/components/calendario/CalendarMonth";
import { CalendarAcademicDates } from "@/components/calendario/CalendarAcademicDates";
import { EditableSchedulePanel } from "@/components/schedule/EditableSchedulePanel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Modal } from "@/components/ui/Modal";
import { FilterBar } from "@/components/ui/FilterBar";
import { EventDetailContent } from "@/components/ui/ActivityDetail";
import type { CalendarEvent, EventTypeFilter } from "@/config/mock/calendar";
import { useModuleLayout, type ModuleDefinition } from "@/hooks/useModuleLayout";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";

const MODULES: ModuleDefinition[] = [
  { id: "calendar", label: "Calendário mensal", colClass: "col-7" },
  { id: "events", label: "Próximos eventos", colClass: "col-5" },
  { id: "academic", label: "Datas acadêmicas", colClass: "col-5" },
  { id: "schedule", label: "Grade semanal", colClass: "col-7" },
];

const FILTER_OPTIONS = ["Todas", "Tarefa", "Prova", "Evento", "Aula"];
const filterMap: Record<string, EventTypeFilter> = {
  Todas: "todas", Tarefa: "tarefa", Prova: "prova", Evento: "evento", Aula: "aula",
};

export function CalendarioView() {
  const calendar = useCalendarEvents();
  const [filter, setFilter] = useState<EventTypeFilter>("todas");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const layout = useModuleLayout("calendario", MODULES);

  const activeLabel = Object.entries(filterMap).find(([, v]) => v === filter)?.[0] ?? "Todas";

  const selectedLive =
    selectedEvent && calendar.events.find((e) => e.id === selectedEvent.id);

  const renderModule = (id: string) => {
    switch (id) {
      case "calendar":
        return (
          <div className="card">
            <CalendarMonth
              filter={filter}
              events={calendar.events}
              onEventSelect={setSelectedEvent}
              onToggleDone={calendar.toggleDone}
              onAddManualEvent={calendar.addManualEvent}
            />
          </div>
        );
      case "events":
        return (
          <CalendarEventsList
            filter={filter}
            events={calendar.events}
            onFilterChange={setFilter}
            onEventSelect={setSelectedEvent}
            showFilters={false}
          />
        );
      case "academic":
        return <CalendarAcademicDates />;
      case "schedule":
        return (
          <div className="card">
            <EditableSchedulePanel />
          </div>
        );
      default:
        return null;
    }
  };

  if (!layout.hydrated || !calendar.hydrated) return null;

  return (
    <PageGrid>
      <PageHeader eyebrow="Agenda" title="Calendário" subtitle="Clique em qualquer atividade para ver detalhes · personalize os módulos" />
      <ModuleGrid
        layout={layout}
        modules={MODULES}
        renderModule={renderModule}
        beforeModules={
          <div className="col-12 calendar-page-filters">
            <div className="calendar-filters-card card">
              <div className="calendar-filters-header">
                <SectionHeader title="Filtrar eventos" icon="filter" />
                <FilterBar filters={FILTER_OPTIONS} active={activeLabel} onChange={(l) => setFilter(filterMap[l] ?? "todas")} />
              </div>
            </div>
          </div>
        }
      />
      <Modal open={Boolean(selectedLive)} onClose={() => setSelectedEvent(null)} title={selectedLive?.title ?? "Evento"}>
        {selectedLive && (
          <EventDetailContent
            event={selectedLive}
            onClose={() => setSelectedEvent(null)}
            onToggleDone={calendar.toggleDone}
          />
        )}
      </Modal>
    </PageGrid>
  );
}
