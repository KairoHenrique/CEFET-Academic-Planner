"use client";

import { useState } from "react";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { CalendarMonth } from "@/components/calendario/CalendarMonth";
import { CalendarEventsList } from "@/components/calendario/CalendarMonth";
import { CalendarAcademicDates } from "@/components/calendario/CalendarAcademicDates";
import { WeeklyScheduleTable } from "@/components/schedule/WeeklyScheduleTable";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Modal } from "@/components/ui/Modal";
import { FilterBar } from "@/components/ui/FilterBar";
import { EventDetailContent } from "@/components/ui/ActivityDetail";
import type { CalendarEvent, EventTypeFilter } from "@/config/mock/calendar";
import { type ModuleDefinition } from "@/hooks/useModuleLayout";
import { useModuleLayout } from "@/hooks/useModuleLayout";

const MODULES: ModuleDefinition[] = [
  { id: "calendar", label: "Calendário mensal", colClass: "col-7" },
  { id: "events", label: "Próximos eventos", colClass: "col-5" },
  { id: "academic", label: "Datas acadêmicas", colClass: "col-5" },
  { id: "schedule", label: "Grade semanal", colClass: "col-7" },
];

const FILTER_OPTIONS = ["Todas", "Tarefa", "Prova", "Evento", "Aula"];

const filterMap: Record<string, EventTypeFilter> = {
  Todas: "todas",
  Tarefa: "tarefa",
  Prova: "prova",
  Evento: "evento",
  Aula: "aula",
};

export function CalendarioView() {
  const [filter, setFilter] = useState<EventTypeFilter>("todas");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const layout = useModuleLayout("calendario", MODULES);

  const activeLabel =
    Object.entries(filterMap).find(([, v]) => v === filter)?.[0] ?? "Todas";

  const renderModule = (id: string) => {
    switch (id) {
      case "calendar":
        return (
          <div className="card">
            <CalendarMonth filter={filter} onEventSelect={setSelectedEvent} />
          </div>
        );
      case "events":
        return (
          <CalendarEventsList
            filter={filter}
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
            <SectionHeader title="Grade Semanal Completa" icon="calendar" />
            <WeeklyScheduleTable />
          </div>
        );
      default:
        return null;
    }
  };

  if (!layout.hydrated) return null;

  return (
    <PageGrid>
      <PageHeader
        eyebrow="Agenda"
        title="Calendário"
        subtitle="Clique em qualquer atividade para ver detalhes · personalize os módulos"
      />

      <ModuleGrid
        layout={layout}
        modules={MODULES}
        renderModule={renderModule}
        beforeModules={
          <div className="col-12 calendar-page-filters">
            <div className="calendar-filters-card card">
              <div className="calendar-filters-header">
                <SectionHeader title="Filtrar eventos" icon="filter" />
                <FilterBar
                  filters={FILTER_OPTIONS}
                  active={activeLabel}
                  onChange={(label) => setFilter(filterMap[label] ?? "todas")}
                />
              </div>
            </div>
          </div>
        }
      />

      <Modal
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title ?? "Evento"}
      >
        {selectedEvent && (
          <EventDetailContent
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </Modal>
    </PageGrid>
  );
}
