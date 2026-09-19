"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarEvent } from "@/lib/types/calendar";
import {
  CALENDAR_EVENT_TYPES,
  eventTypeLabels,
  UNLINKED_SUBJECT_VALUE,
} from "@/lib/types/calendar";
import { resolveDefaultEventColor } from "@/lib/colors/event-type-colors";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { Input } from "@/components/ui/Input";
import { PlannerSelect } from "@/components/ui/PlannerSelect";
import { ColorDotPicker } from "@/components/ui/ColorDotPicker";
import { WeekdayRecurrencePicker } from "@/components/calendario/WeekdayRecurrencePicker";
import type { WeekdayIndex } from "@/lib/calendar/recurrence-weekdays";
import type { ManualCalendarEventInput } from "@/lib/types/calendar-api";

interface AddEventFormProps {
  defaultDate: string;
  isSubmitting?: boolean;
  onSubmit: (event: ManualCalendarEventInput) => void;
  onCancel: () => void;
}

const TYPE_OPTIONS = CALENDAR_EVENT_TYPES.map((value) => ({
  value,
  label: eventTypeLabels[value],
}));

function formatTodayIso(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function resolveDefaultDate(value: string): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return formatTodayIso();
}

export function AddEventForm({
  defaultDate,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: AddEventFormProps) {
  const { items: subjects } = useDisciplinas();
  const resolvedDefaultDate = resolveDefaultDate(defaultDate);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("tarefa");
  const [subjectCode, setSubjectCode] = useState(UNLINKED_SUBJECT_VALUE);
  const [color, setColor] = useState("");
  const [colorTouched, setColorTouched] = useState(false);
  const [startDate, setStartDate] = useState(resolvedDefaultDate);
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [recurrenceDays, setRecurrenceDays] = useState<WeekdayIndex[]>([]);

  const activeSubjectCode = subjectCode || UNLINKED_SUBJECT_VALUE;
  const isUnlinked = activeSubjectCode === UNLINKED_SUBJECT_VALUE;
  const subject = subjects.find((item) => item.code === activeSubjectCode);
  const hasWeeklyRecurrence = recurrenceDays.length > 0;

  useEffect(() => {
    setTitle("");
    setDescription("");
    setType("tarefa");
    setSubjectCode(UNLINKED_SUBJECT_VALUE);
    setColor("");
    setColorTouched(false);
    setStartDate(resolvedDefaultDate);
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setRecurrenceDays([]);
  }, [resolvedDefaultDate]);

  useEffect(() => {
    if (colorTouched) return;
    setColor(
      resolveDefaultEventColor(type, !isUnlinked ? subject?.color : null)
    );
  }, [type, subject?.color, isUnlinked, colorTouched]);

  const previewColor = useMemo(() => {
    if (colorTouched && color) return color;
    return resolveDefaultEventColor(type, !isUnlinked ? subject?.color : null);
  }, [color, colorTouched, isUnlinked, subject?.color, type]);

  const subjectOptions = useMemo(
    () => [
      { value: UNLINKED_SUBJECT_VALUE, label: "Não associado à matéria" },
      ...subjects.map((item) => ({
        value: item.code,
        label: item.name,
      })),
    ],
    [subjects]
  );

  const handleSubjectChange = (next: string) => {
    setSubjectCode(next);
    if (colorTouched) return;
    setColor("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || isSubmitting) return;
    if (hasWeeklyRecurrence && !endDate) return;

    const resolvedColor =
      colorTouched && color
        ? color
        : resolveDefaultEventColor(type, !isUnlinked ? subject?.color : null);

    onSubmit({
      title: title.trim(),
      description:
        description.trim() ||
        (isUnlinked
          ? "Evento pessoal adicionado manualmente."
          : "Tarefa adicionada manualmente."),
      type,
      date: startDate,
      dateEnd: endDate || undefined,
      timeStart: startTime || undefined,
      timeEnd: endTime || undefined,
      recurrence: hasWeeklyRecurrence ? "weekly" : "none",
      recurrenceDays: hasWeeklyRecurrence ? recurrenceDays : undefined,
      subject: isUnlinked ? undefined : subject?.name,
      subjectCode: isUnlinked ? undefined : activeSubjectCode,
      color: resolvedColor,
      colorOverride: colorTouched,
      done: false,
    });
  };

  return (
    <form className="add-event-form" onSubmit={handleSubmit}>
      <Input
        label="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ex.: Revisar capítulo 3"
        autoComplete="off"
        required
        disabled={isSubmitting}
      />
      <PlannerSelect
        label="Disciplina"
        value={activeSubjectCode}
        fullWidth
        options={subjectOptions}
        onChange={handleSubjectChange}
      />
      <PlannerSelect
        label="Tipo"
        value={type}
        fullWidth
        options={TYPE_OPTIONS}
        onChange={(next) => setType(next as CalendarEvent["type"])}
      />
      <div className="form-field add-event-color-field">
        <div className="add-event-color-row">
          <span className="form-label">Cor no calendário</span>
          <ColorDotPicker
            value={color || previewColor}
            onChange={(next) => {
              setColorTouched(true);
              setColor(next);
            }}
            disabled={isSubmitting}
            ariaLabel="Personalizar cor do evento"
            modalTitle="Cor do evento"
            pickerLabel="Cor personalizada"
            size="sm"
          />
        </div>
        <p className="add-event-color-hint">
          {type === "aula" && !isUnlinked
            ? "Aulas usam a cor da matéria. Toque na bolinha para personalizar."
            : isUnlinked
              ? "Cor automática por tipo se você não personalizar."
              : "Cor sugerida pelo tipo. Toque na bolinha para mudar."}
        </p>
      </div>

      <div className="add-event-datetime-block">
        <span className="form-label">Início</span>
        <div className="add-event-datetime-row">
          <DatePickerField
            label="Data de início"
            value={startDate}
            onChange={setStartDate}
            required
            disabled={isSubmitting}
          />
          <Input
            label="Hora de início"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="add-event-datetime-block">
        <span className="form-label">
          Fim{" "}
          <span className="form-label-optional">
            {hasWeeklyRecurrence ? "(obrigatório p/ repetir)" : "(opcional)"}
          </span>
        </span>
        <div className="add-event-datetime-row">
          <DatePickerField
            label="Data de fim"
            value={endDate}
            onChange={setEndDate}
            disabled={isSubmitting}
            min={startDate || undefined}
            required={hasWeeklyRecurrence}
            allowClear={!hasWeeklyRecurrence}
          />
          <Input
            label="Hora de fim"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <p className="add-event-field-hint">
          {hasWeeklyRecurrence
            ? "Repete toda semana nos dias marcados, até a data de fim."
            : "Sem fim informado, vale só no dia de início."}
        </p>
      </div>

      <WeekdayRecurrencePicker
        selectedDays={recurrenceDays}
        disabled={isSubmitting}
        onChange={setRecurrenceDays}
      />

      <label className="form-field">
        <span className="form-label">Descrição</span>
        <textarea
          className="form-input form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder={
            isUnlinked
              ? "Estágio, monitoria, projeto pessoal…"
              : "O que precisa ser feito?"
          }
          disabled={isSubmitting}
        />
      </label>
      <div className="detail-actions">
        <button type="submit" className="btn-gold" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar evento"}
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
