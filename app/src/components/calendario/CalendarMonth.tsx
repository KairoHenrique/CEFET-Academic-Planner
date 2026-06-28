"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { AddEventForm } from "@/components/calendario/AddEventForm";
import {
  eventTypeLabels,
  formatEventDate,
  parseLocalDate,
  type CalendarEvent,
  type EventTypeFilter,
} from "@/lib/types/calendar";
import { FilterBar } from "@/components/ui/FilterBar";
import { DayEventsContent, EventDetailContent } from "@/components/ui/ActivityDetail";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const FILTER_OPTIONS = ["Todas", "Tarefa", "Prova", "Evento", "Aula"];

const filterMap: Record<string, EventTypeFilter> = {
  Todas: "todas",
  Tarefa: "tarefa",
  Prova: "prova",
  Evento: "evento",
  Aula: "aula",
};

function densityClass(count: number): string {
  if (count >= 4) return "density-4";
  if (count === 3) return "density-3";
  if (count === 2) return "density-2";
  if (count === 1) return "density-1";
  return "";
}

interface CalendarMonthProps {
  filter: EventTypeFilter;
  events: CalendarEvent[];
  isAdding?: boolean;
  onEventSelect: (event: CalendarEvent) => void;
  onToggleDone: (id: string) => void;
  onAddManualEvent: (event: Omit<CalendarEvent, "id" | "manual">) => void;
}

export function CalendarMonth({
  filter,
  events,
  isAdding = false,
  onEventSelect,
  onToggleDone,
  onAddManualEvent,
}: CalendarMonthProps) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dayModal, setDayModal] = useState<{ day: number; events: CalendarEvent[] } | null>(null);
  const [addModal, setAddModal] = useState<string | null>(null);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthLabel = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventsByDay = useMemo(() => {
    return events.reduce<Record<number, CalendarEvent[]>>((acc, event) => {
      const date = parseLocalDate(event.date);
      if (date.getMonth() !== monthIndex || date.getFullYear() !== year) return acc;
      if (filter !== "todas" && event.type !== filter) return acc;
      const day = date.getDate();
      acc[day] = [...(acc[day] ?? []), event];
      return acc;
    }, {});
  }, [events, filter, monthIndex, year]);

  const dayIso = (day: number) =>
    `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    monthIndex === today.getMonth() &&
    year === today.getFullYear();

  return (
    <>
      <div className="calendar-month">
        <div className="calendar-month-header">
          <button type="button" className="calendar-nav-btn" aria-label="Mês anterior" onClick={() => setMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}>
            <Icon name="chevron-left" size={18} />
          </button>
          <h3 className="calendar-month-title">{monthLabel}</h3>
          <button type="button" className="calendar-nav-btn" aria-label="Próximo mês" onClick={() => setMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}>
            <Icon name="chevron-right" size={18} />
          </button>
        </div>
        <div className="calendar-weekdays">{WEEKDAYS.map((d) => <span key={d}>{d}</span>)}</div>
        <div className="calendar-grid">
          {cells.map((day, idx) => {
            const dayEvents = day ? eventsByDay[day] ?? [] : [];
            return (
              <button
                key={idx}
                type="button"
                disabled={!day}
                className={`calendar-day calendar-day-btn ${day ? "" : "empty"} ${day && isToday(day) ? "today" : ""} ${dayEvents.length ? "has-events" : ""} ${densityClass(dayEvents.length)}`}
                onClick={() => day && setDayModal({ day, events: dayEvents })}
              >
                {day && (
                  <>
                    {dayEvents.length > 0 && (
                      <span className="calendar-day-count" aria-hidden="true">{dayEvents.length}</span>
                    )}
                    <span className="calendar-day-number">{day}</span>
                    <div className="calendar-day-events">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <span
                          key={ev.id}
                          className={`calendar-event-pill ${ev.done ? "done" : ""}`}
                          style={{
                            background: `color-mix(in srgb, ${ev.color} 30%, transparent)`,
                            borderColor: `color-mix(in srgb, ${ev.color} 55%, transparent)`,
                            color: ev.color,
                          }}
                        >
                          {ev.title.length > 14 ? `${ev.title.slice(0, 14)}…` : ev.title}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="calendar-event-more">+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Modal open={Boolean(dayModal)} onClose={() => setDayModal(null)} title="Eventos do dia">
        {dayModal && (
          <DayEventsContent
            day={dayModal.day}
            monthLabel={monthLabel}
            events={dayModal.events}
            onSelectEvent={(event) => { setDayModal(null); onEventSelect(event); }}
            onToggleDone={onToggleDone}
            onAddEvent={() => { setAddModal(dayIso(dayModal.day)); setDayModal(null); }}
          />
        )}
      </Modal>

      <Modal open={Boolean(addModal)} onClose={() => setAddModal(null)} title="Novo evento">
        {addModal && (
          <AddEventForm
            defaultDate={addModal}
            isSubmitting={isAdding}
            onSubmit={(event) => { onAddManualEvent(event); setAddModal(null); }}
            onCancel={() => setAddModal(null)}
          />
        )}
      </Modal>
    </>
  );
}

interface CalendarEventsListProps {
  filter: EventTypeFilter;
  events: CalendarEvent[];
  onFilterChange: (filter: EventTypeFilter) => void;
  onEventSelect: (event: CalendarEvent) => void;
  showFilters?: boolean;
}

export function CalendarEventsList({
  filter,
  events,
  onFilterChange,
  onEventSelect,
  showFilters = true,
}: CalendarEventsListProps) {
  const activeLabel = Object.entries(filterMap).find(([, v]) => v === filter)?.[0] ?? "Todas";
  const filteredEvents = events.filter((e) => filter === "todas" || e.type === filter);

  return (
    <div className="card calendar-events-card">
      <div className="calendar-events-header">
        <h3 className="section-header-title">Próximos Eventos</h3>
        {showFilters && (
          <FilterBar filters={FILTER_OPTIONS} active={activeLabel} onChange={(l) => onFilterChange(filterMap[l] ?? "todas")} />
        )}
      </div>
      <ul className="event-list">
        {filteredEvents.length === 0 ? (
          <li className="calendar-empty-state">Nenhum evento neste filtro.</li>
        ) : (
          filteredEvents.map((event) => (
            <li key={event.id}>
              <button type="button" className="event-list-item event-list-btn" onClick={() => onEventSelect(event)}>
                <span className="event-dot" style={{ background: event.color }} />
                <div>
                  <p className={`event-title ${event.done ? "completed" : ""}`}>{event.title}</p>
                  <p className="event-meta">{formatEventDate(event.date)}{event.subject && ` · ${event.subject}`}</p>
                </div>
                <span className="badge info">{eventTypeLabels[event.type]}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
