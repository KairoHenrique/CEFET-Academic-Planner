"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { CalendarMonth, CalendarEventsList } from "@/components/calendario/CalendarMonth";
import { CalendarAcademicDates } from "@/components/calendario/CalendarAcademicDates";
import { CalendarSkeleton } from "@/components/calendario/CalendarSkeleton";
import { EditableSchedulePanel } from "@/components/schedule/EditableSchedulePanel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Modal } from "@/components/ui/Modal";
import { FilterBar } from "@/components/ui/FilterBar";
import { EventDetailContent } from "@/components/ui/ActivityDetail";
import type { CalendarEvent, EventTypeFilter } from "@/lib/types/calendar";
import {
  CALENDAR_FILTER_OPTIONS,
  filterLabelToType,
} from "@/lib/types/calendar";
import { useModuleLayout, type ModuleDefinition } from "@/hooks/useModuleLayout";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";

const MODULES: ModuleDefinition[] = [
  { id: "calendar", label: "Calendário mensal", colClass: "col-7" },
  { id: "events", label: "Próximos eventos", colClass: "col-5" },
  { id: "academic", label: "Datas acadêmicas", colClass: "col-5" },
  { id: "schedule", label: "Grade semanal", colClass: "col-7" },
];

const FILTER_OPTIONS = [...CALENDAR_FILTER_OPTIONS];
const filterMap = filterLabelToType;

export function CalendarioView() {
  const calendar = useCalendarEvents();
  const calendarPanelRef = useRef<HTMLDivElement>(null);
  const [eventsPanelHeight, setEventsPanelHeight] = useState<number>();
  const [filter, setFilter] = useState<EventTypeFilter>("todas");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const layout = useModuleLayout("calendario", MODULES);

  useLayoutEffect(() => {
    const panel = calendarPanelRef.current;
    if (!panel) return;

    const syncHeight = () => {
      setEventsPanelHeight(panel.offsetHeight);
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(panel);
    window.addEventListener("resize", syncHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, [calendar.isLoading, layout.hydrated, calendar.events.length, filter]);

  const activeLabel = Object.entries(filterMap).find(([, v]) => v === filter)?.[0] ?? "Todas";

  const selectedLive =
    selectedEvent && calendar.events.find((e) => e.id === selectedEvent.id);

  const renderModule = (id: string) => {
    switch (id) {
      case "calendar":
        return (
          <div ref={calendarPanelRef} className="card calendar-panel-card">
            <CalendarMonth
              filter={filter}
              events={calendar.events}
              isAdding={calendar.isAdding}
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
            panelHeight={eventsPanelHeight}
          />
        );
      case "academic":
        return (
          <CalendarAcademicDates
            items={calendar.academicDates}
            isLoading={calendar.isLoading}
          />
        );
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

  if (!layout.hydrated) return null;

  if (calendar.isLoading) {
    return (
      <PageGrid>
        <PageHeader eyebrow="Agenda" title="Calendário" subtitle="Carregando eventos…" />
        <CalendarSkeleton />
      </PageGrid>
    );
  }

  if (calendar.error && calendar.events.length === 0) {
    return (
      <PageGrid>
        <PageHeader eyebrow="Agenda" title="Calendário" subtitle="Não foi possível carregar a agenda." />
        <div className="col-12">
          <div className="card calendar-error-card">
            <p className="calendar-error-message">{calendar.error}</p>
            <button type="button" className="btn-gold" onClick={() => void calendar.refetch()}>
              Tentar novamente
            </button>
          </div>
        </div>
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <PageHeader
        eyebrow="Agenda"
        title="Calendário"
        subtitle={
          calendar.isFetching
            ? "Atualizando eventos…"
            : "Clique em qualquer atividade para ver detalhes · personalize os módulos"
        }
      />
      {calendar.error && (
        <div className="col-12">
          <p className="calendar-inline-error" role="alert">
            {calendar.error}
          </p>
        </div>
      )}
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
