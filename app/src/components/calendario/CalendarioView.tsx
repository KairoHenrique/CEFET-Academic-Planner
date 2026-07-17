"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalendarMonth, CalendarEventsList } from "@/components/calendario/CalendarMonth";
import { CalendarAcademicDates } from "@/components/calendario/CalendarAcademicDates";
import { CalendarSkeleton } from "@/components/calendario/CalendarSkeleton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Modal } from "@/components/ui/Modal";
import { FilterBar } from "@/components/ui/FilterBar";
import { EventDetailContent } from "@/components/ui/ActivityDetail";
import { CalendarAlertBanner } from "@/components/alerts/CalendarAlertBanner";
import type { CalendarEvent, EventTypeFilter } from "@/lib/types/calendar";
import {
  CALENDAR_FILTER_OPTIONS,
  filterLabelToType,
} from "@/lib/types/calendar";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";

const FILTER_OPTIONS = [...CALENDAR_FILTER_OPTIONS];
const filterMap = filterLabelToType;

export function CalendarioView() {
  const calendar = useCalendarEvents();
  const calendarPanelRef = useRef<HTMLDivElement>(null);
  const [eventsPanelHeight, setEventsPanelHeight] = useState<number>();
  const [filter, setFilter] = useState<EventTypeFilter>("todas");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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
  }, [calendar.isLoading, calendar.events.length, filter]);

  const activeLabel =
    Object.entries(filterMap).find(([, value]) => value === filter)?.[0] ?? "Todas";

  const selectedLive =
    selectedEvent && calendar.events.find((event) => event.id === selectedEvent.id);

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
        <PageHeader
          eyebrow="Agenda"
          title="Calendário"
          subtitle="Não foi possível carregar a agenda."
        />
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
            : "Clique em qualquer atividade para ver detalhes"
        }
      />

      {calendar.error && (
        <div className="col-12">
          <p className="calendar-inline-error" role="alert">
            {calendar.error}
          </p>
        </div>
      )}

      <CalendarAlertBanner />

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

      <div className="col-7">
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
      </div>

      <div className="col-5">
        <CalendarEventsList
          filter={filter}
          events={calendar.events}
          onFilterChange={setFilter}
          onEventSelect={setSelectedEvent}
          showFilters={false}
          panelHeight={eventsPanelHeight}
        />
      </div>

      <div className="col-12 calendar-academic-dates-col">
        <CalendarAcademicDates
          groups={calendar.academicDateGroups}
          isLoading={calendar.isLoading}
        />
      </div>

      <Modal
        open={Boolean(selectedLive)}
        onClose={() => setSelectedEvent(null)}
        title={selectedLive?.title ?? "Evento"}
      >
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
