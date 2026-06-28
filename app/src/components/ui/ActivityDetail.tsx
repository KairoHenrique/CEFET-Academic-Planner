import Link from "next/link";
import type { CalendarEvent } from "@/lib/types/calendar";
import {
  eventTypeLabels,
  formatEventDate,
} from "@/lib/types/calendar";
import type { ScheduleSlotData } from "@/config/mock/schedule";
import type { AcademicTask } from "@/config/mock/tasks";
import { Icon } from "./Icon";

interface EventDetailContentProps {
  event: CalendarEvent;
  onClose: () => void;
  onToggleDone?: (id: string) => void;
}

export function EventDetailContent({ event, onClose, onToggleDone }: EventDetailContentProps) {
  return (
  <>
      <div className="detail-meta-row">
        <div className="detail-meta-badges">
          <span className={`badge info`}>{eventTypeLabels[event.type]}</span>
          {event.done && <span className="badge success">Concluída</span>}
        </div>
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
      {event.type === "tarefa" && onToggleDone && (
        <button
          type="button"
          className="btn-outline"
          onClick={() => onToggleDone(event.id)}
        >
          <Icon name="check" size={14} />
          {event.done ? "Marcar pendente" : "Marcar concluída"}
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
  return (
    <>
      <div className="detail-meta-row">
        <div className="detail-meta-badges">
          <span className="badge gold">{slot.code}</span>
          {simulated && <span className="badge info">Simulado</span>}
        </div>
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

interface TaskDetailContentProps {
  task: AcademicTask;
  onClose: () => void;
  onToggleDone?: () => void;
  onEdit?: () => void;
}

export function TaskDetailContent({
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

      <p className="detail-description">{task.description}</p>

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
          href={`/disciplinas/${task.subjectCode}`}
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
}

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
              {event.type === "tarefa" && onToggleDone && (
                <button
                  type="button"
                  className={`task-checkbox ${event.done ? "checked" : ""}`}
                  onClick={() => onToggleDone(event.id)}
                  aria-label={`Marcar ${event.title}`}
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
                <span className={`badge info`}>{eventTypeLabels[event.type]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
