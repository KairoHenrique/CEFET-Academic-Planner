import { memo } from "react";
import Link from "next/link";
import type { CalendarEvent } from "@/lib/types/calendar";
import { formatCalendarEventDateLabel } from "@/lib/types/calendar";
import {
  canDeleteCalendarEvent,
  canToggleCalendarEvent,
} from "@/lib/calendar/event-types";
import type { ScheduleSlotData } from "@/config/mock/schedule";
import type { AcademicTask } from "@/config/mock/tasks";
import { disciplinaDetailPath } from "@/lib/disciplinas/disciplina-path";
import { Icon } from "./Icon";
import { EventTypeBadge } from "./EventTypeBadge";
import { FormattedDescription } from "./FormattedDescription";

interface EventDetailContentProps {
  event: CalendarEvent;
  onClose: () => void;
  onToggleDone?: (id: string) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function EventDetailContent({
  event,
  onClose,
  onToggleDone,
  onDelete,
  isDeleting = false,
}: EventDetailContentProps) {
  return (
  <>
      <div className="detail-meta-row">
        <div className="detail-meta-badges">
          <EventTypeBadge type={event.type} color={event.color} />
          {event.done && <span className="badge success">Concluída</span>}
        </div>
        <span className="detail-date">{formatCalendarEventDateLabel(event)}</span>
      </div>

    {event.subject && (
      <p className="detail-subject">
        <span className="subject-dot" style={{ background: event.color }} />
        {event.subject}
      </p>
    )}

    <FormattedDescription text={event.description} />

    <div className="detail-actions">
      {event.subjectCode && (
        <Link
          href={disciplinaDetailPath(event.subjectCode)}
          className="btn-gold"
          onClick={onClose}
        >
          <Icon name="books" size={14} />
          Ver disciplina
        </Link>
      )}
      {canToggleCalendarEvent(event.id) && onToggleDone && (
        <button
          type="button"
          className="btn-outline"
          onClick={() => onToggleDone(event.id)}
        >
          <Icon name="check" size={14} />
          {event.done ? "Marcar pendente" : "Marcar concluída"}
        </button>
      )}
      {canDeleteCalendarEvent(event) && onDelete && (
        <button
          type="button"
          className="btn-outline btn-danger"
          disabled={isDeleting}
          onClick={() => onDelete(event.id)}
        >
          <Icon name="close" size={14} />
          {isDeleting ? "Excluindo…" : "Excluir"}
        </button>
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
  const apelido = slot.name;
  const officialName = slot.displayName ?? slot.courseName;
  const subjectTitle =
    officialName && officialName.trim() !== apelido.trim() ? officialName : apelido;

  return (
    <>
      <div className="detail-meta-row">
        <div className="detail-meta-badges">
          {simulated ? (
            <span className="course-node-code detail-apelido">{apelido}</span>
          ) : (
            <span className="badge gold">{apelido}</span>
          )}
          {simulated && <span className="badge info">Simulado</span>}
        </div>
      </div>

      <p className="detail-subject">
        <span className="subject-dot" style={{ background: slot.color }} />
        {subjectTitle}
      </p>

      <ul className="detail-facts">
        <li><strong>Dia:</strong> {day}</li>
        <li><strong>Horário:</strong> {time}</li>
        <li><strong>Sala:</strong> {slot.room}</li>
        {slot.professor && <li><strong>Professor:</strong> {slot.professor}</li>}
        {slot.ch && <li><strong>Carga horária:</strong> {slot.ch}h</li>}
      </ul>

      <div className="detail-actions">
        {slot.code !== "EXTRA" && (
          <Link
            href={disciplinaDetailPath(slot.code)}
            className="btn-gold"
            onClick={onClose}
          >
            <Icon name="books" size={14} />
            Ver disciplina
          </Link>
        )}
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

interface TaskDetailContentProps {
  task: AcademicTask;
  onClose: () => void;
  onToggleDone?: () => void;
  onEdit?: () => void;
}

export const TaskDetailContent = memo(function TaskDetailContent({
  task,
  onClose,
  onToggleDone,
  onEdit,
}: TaskDetailContentProps) {
  return (
    <>
      <div className="detail-meta-row">
        <div className="detail-meta-badges">
          <span className="badge info">
            {task.type === "grupo" ? "Grupo" : "Individual"}
          </span>
          <span className={`badge ${task.done ? "success" : "warning"}`}>
            {task.done ? "Concluída" : "Pendente"}
          </span>
        </div>
        <span className="detail-date">
          {task.date} · até {task.dueTime}
        </span>
      </div>

      <p className="detail-subject">
        <span className="subject-dot" style={{ background: task.subjectColor }} />
        {task.subject}
      </p>

      <FormattedDescription text={task.description} />

      {task.instructions.length > 0 && (
        <div className="detail-block">
          <h4 className="detail-block-title">O que fazer</h4>
          <ul className="detail-checklist">
            {task.instructions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {task.deliverables.length > 0 && (
        <div className="detail-block">
          <h4 className="detail-block-title">Entregáveis</h4>
          <ul className="detail-checklist">
            {task.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {task.hasGrade && task.maxGrade !== undefined && (
        <p className="detail-grade-note">
          Vale até <strong>{task.maxGrade} pontos</strong> na disciplina.
        </p>
      )}

      <div className="detail-actions">
        <Link
          href={disciplinaDetailPath(task.subjectCode)}
          className="btn-gold"
          onClick={onClose}
        >
          <Icon name="books" size={14} />
          Ver disciplina
        </Link>
        {onToggleDone && (
          <button type="button" className="btn-outline" onClick={onToggleDone}>
            <Icon name="check" size={14} />
            {task.done ? "Marcar pendente" : "Marcar concluída"}
          </button>
        )}
        {onEdit && (
          <button type="button" className="btn-outline" onClick={onEdit}>
            Editar
          </button>
        )}
      </div>
    </>
  );
});

interface DayEventsContentProps {
  day: number;
  monthLabel: string;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onToggleDone?: (id: string) => void;
  onAddEvent?: () => void;
}

export function DayEventsContent({
  day,
  monthLabel,
  events,
  onSelectEvent,
  onToggleDone,
  onAddEvent,
}: DayEventsContentProps) {
  return (
    <>
      <p className="detail-date">
        {day} de {monthLabel}
      </p>
      {onAddEvent && (
        <button type="button" className="btn-outline day-add-event-btn" onClick={onAddEvent}>
          <Icon name="plus" size={14} />
          Adicionar tarefa
        </button>
      )}
      {events.length === 0 ? (
        <p className="detail-description">Nenhum evento neste dia.</p>
      ) : (
        <ul className="day-events-list">
          {events.map((event) => (
            <li key={event.id} className="day-event-row">
              {canToggleCalendarEvent(event.id) && onToggleDone && (
                <button
                  type="button"
                  className={`task-checkbox ${event.done ? "checked" : ""}`}
                  onClick={(clickEvent) => {
                    clickEvent.stopPropagation();
                    onToggleDone(event.id);
                  }}
                  aria-label={
                    event.done
                      ? `Marcar ${event.title} como pendente`
                      : `Marcar ${event.title} como concluída`
                  }
                >
                  {event.done && <Icon name="check" size={11} />}
                </button>
              )}
              <button
                type="button"
                className="day-event-btn"
                onClick={() => onSelectEvent(event)}
              >
                <span className="subject-dot" style={{ background: event.color }} />
                <span className={event.done ? "event-done" : ""}>{event.title}</span>
                <EventTypeBadge type={event.type} color={event.color} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
