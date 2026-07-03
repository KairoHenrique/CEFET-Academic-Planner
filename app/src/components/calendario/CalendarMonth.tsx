"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { AddEventForm } from "@/components/calendario/AddEventForm";
import {
  eventOccursOnIsoDate,
  formatCalendarEventDateLabel,
  isUpcomingCalendarEvent,
  parseLocalDate,
  CALENDAR_FILTER_OPTIONS,
  filterLabelToType,
  type CalendarEvent,
  type EventTypeFilter,
} from "@/lib/types/calendar";
import type { ManualCalendarEventInput } from "@/lib/types/calendar-api";
import { FilterBar } from "@/components/ui/FilterBar";
import { EventTypeBadge } from "@/components/ui/EventTypeBadge";
import { DayEventsContent, EventDetailContent } from "@/components/ui/ActivityDetail";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const FILTER_OPTIONS = [...CALENDAR_FILTER_OPTIONS];
const filterMap = filterLabelToType;

interface CalendarMonthProps {
  filter: EventTypeFilter;
  events: CalendarEvent[];
  isAdding?: boolean;
  onEventSelect: (event: CalendarEvent) => void;
  onToggleDone: (id: string) => void;
  onAddManualEvent: (event: ManualCalendarEventInput) => void;
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
  const [dayModalDay, setDayModalDay] = useState<number | null>(null);
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
      if (filter !== "todas" && event.type !== filter) return acc;

      for (let day = 1; day <= daysInMonth; day += 1) {
        const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        if (!eventOccursOnIsoDate(event, iso)) continue;
        if (parseLocalDate(iso).getMonth() !== monthIndex) continue;

        acc[day] = [...(acc[day] ?? []), event];
      }

      return acc;
    }, {});
  }, [events, filter, monthIndex, year, daysInMonth]);

  const dayModalEvents =
    dayModalDay != null ? eventsByDay[dayModalDay] ?? [] : [];

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
                className={`calendar-day calendar-day-btn ${day ? "" : "empty"} ${day && isToday(day) ? "today" : ""}`}
                aria-label={
                  day
                    ? dayEvents.length > 0
                      ? `Dia ${day}, ${dayEvents.length} evento${dayEvents.length > 1 ? "s" : ""}`
                      : `Dia ${day}`
                    : undefined
                }
                onClick={() => day && setDayModalDay(day)}
              >
                {day && (
                  <>
                    <div className="calendar-day-top">
                      <span className="calendar-day-number">{day}</span>
                      {dayEvents.length > 0 && (
                        <span
                          className="calendar-day-meta"
                          data-long={dayEvents.length > 9 ? true : undefined}
                          aria-hidden="true"
                        >
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
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

      <Modal open={dayModalDay != null} onClose={() => setDayModalDay(null)} title="Eventos do dia">
        {dayModalDay != null && (
          <DayEventsContent
            day={dayModalDay}
            monthLabel={monthLabel}
            events={dayModalEvents}
            onSelectEvent={(event) => {
              setDayModalDay(null);
              onEventSelect(event);
            }}
            onToggleDone={onToggleDone}
            onAddEvent={() => {
              setAddModal(dayIso(dayModalDay));
              setDayModalDay(null);
            }}
          />
        )}
      </Modal>

      <Modal open={Boolean(addModal)} onClose={() => setAddModal(null)} title="Novo evento">
        {addModal && (
          <AddEventForm
            key={addModal}
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
  panelHeight?: number;
}

export function CalendarEventsList({
  filter,
  events,
  onFilterChange,
  onEventSelect,
  showFilters = true,
  panelHeight,
}: CalendarEventsListProps) {
  const activeLabel = Object.entries(filterMap).find(([, v]) => v === filter)?.[0] ?? "Todas";
  const filteredEvents = events
    .filter((event) => filter === "todas" || event.type === filter)
    .filter((event) => isUpcomingCalendarEvent(event))
    .sort((left, right) => {
      const byDate = left.date.localeCompare(right.date);
      if (byDate !== 0) return byDate;
      return left.title.localeCompare(right.title, "pt-BR");
    });

  return (
    <div
      className="card calendar-events-card"
      style={
        panelHeight != null
          ? {
              height: `${panelHeight}px`,
              maxHeight: `${panelHeight}px`,
            }
          : undefined
      }
    >
      <div className="calendar-events-header">
        <h3 className="section-header-title">Próximos Eventos</h3>
        {showFilters && (
          <FilterBar filters={FILTER_OPTIONS} active={activeLabel} onChange={(l) => onFilterChange(filterMap[l] ?? "todas")} />
        )}
      </div>
      <ul className="event-list event-list--scroll">
        {filteredEvents.length === 0 ? (
          <li className="calendar-empty-state">Nenhum evento neste filtro.</li>
        ) : (
          filteredEvents.map((event) => (
            <li key={event.id}>
              <button type="button" className="event-list-item event-list-btn" onClick={() => onEventSelect(event)}>
                <span className="event-dot" style={{ background: event.color }} />
                <div>
                  <p className={`event-title ${event.done ? "completed" : ""}`}>{event.title}</p>
                  <p className="event-meta">
                    {formatCalendarEventDateLabel(event)}
                    {event.subject && ` · ${event.subject}`}
                  </p>
                </div>
                <EventTypeBadge type={event.type} color={event.color} />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
