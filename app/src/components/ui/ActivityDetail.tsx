import Link from "next/link";
import type { CalendarEvent } from "@/config/mock/calendar";
import {
  eventTypeLabels,
  formatEventDate,
} from "@/config/mock/calendar";
import type { ScheduleSlotData } from "@/config/mock/schedule";
import { Icon } from "./Icon";

interface EventDetailContentProps {
  event: CalendarEvent;
  onClose: () => void;
}

export function EventDetailContent({ event, onClose }: EventDetailContentProps) {
  return (
  <>
    <div className="detail-meta-row">
      <span className={`badge info`}>{eventTypeLabels[event.type]}</span>
      <span className="detail-date">{formatEventDate(event.date)}</span>
    </div>

    {event.subject && (
      <p className="detail-subject">
        <span className="subject-dot" style={{ background: event.color }} />
        {event.subject}
      </p>
    )}

    <p className="detail-description">{event.description}</p>

    <div className="detail-actions">
      {event.subjectCode && (
        <Link
          href={`/disciplinas/${event.subjectCode}`}
          className="btn-gold"
          onClick={onClose}
        >
          <Icon name="books" size={14} />
          Ver disciplina
        </Link>
      )}
      <button type="button" className="btn-outline" onClick={onClose}>
        Fechar
      </button>
    </div>
  </>
  );
}

interface ScheduleDetailContentProps {
  slot: ScheduleSlotData;
  day: string;
  time: string;
  onClose: () => void;
  onRemove?: () => void;
  simulated?: boolean;
}

export function ScheduleDetailContent({
  slot,
  day,
  time,
  onClose,
  onRemove,
  simulated,
}: ScheduleDetailContentProps) {
  return (
    <>
      <div className="detail-meta-row">
        <span className="badge gold">{slot.code}</span>
        {simulated && <span className="badge info">Simulado</span>}
      </div>

      <p className="detail-subject">
        <span className="subject-dot" style={{ background: slot.color }} />
        {slot.name}
      </p>

      <ul className="detail-facts">
        <li><strong>Dia:</strong> {day}</li>
        <li><strong>Horário:</strong> {time}</li>
        <li><strong>Sala:</strong> {slot.room}</li>
        {slot.professor && <li><strong>Professor:</strong> {slot.professor}</li>}
        {slot.ch && <li><strong>Carga horária:</strong> {slot.ch}h</li>}
      </ul>

      <div className="detail-actions">
        <Link
          href={`/disciplinas/${slot.code}`}
          className="btn-gold"
          onClick={onClose}
        >
          <Icon name="books" size={14} />
          Ver disciplina
        </Link>
        {onRemove && (
          <button type="button" className="btn-outline btn-danger" onClick={onRemove}>
            Remover da grade
          </button>
        )}
        <button type="button" className="btn-outline" onClick={onClose}>
          Fechar
        </button>
      </div>
    </>
  );
}

interface DayEventsContentProps {
  day: number;
  monthLabel: string;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export function DayEventsContent({
  day,
  monthLabel,
  events,
  onSelectEvent,
}: DayEventsContentProps) {
  return (
    <>
      <p className="detail-date">
        {day} de {monthLabel}
      </p>
      {events.length === 0 ? (
        <p className="detail-description">Nenhum evento neste dia.</p>
      ) : (
        <ul className="day-events-list">
          {events.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                className="day-event-btn"
                onClick={() => onSelectEvent(event)}
              >
                <span className="subject-dot" style={{ background: event.color }} />
                <span>{event.title}</span>
                <span className={`badge info`}>{eventTypeLabels[event.type]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
