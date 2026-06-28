"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarEvent } from "@/lib/types/calendar";
import {
  CALENDAR_EVENT_TYPES,
  eventTypeLabels,
  UNLINKED_SUBJECT_VALUE,
} from "@/lib/types/calendar";
import { DEFAULT_EVENT_COLOR } from "@/lib/colors/palette";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { Input } from "@/components/ui/Input";
import { PlannerSelect } from "@/components/ui/PlannerSelect";
import { ColorDotPicker } from "@/components/ui/ColorDotPicker";

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

export function AddEventForm({
  defaultDate,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: AddEventFormProps) {
  const { items: subjects } = useDisciplinas();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("tarefa");
  const [subjectCode, setSubjectCode] = useState("");
  const [color, setColor] = useState("");
  const [colorTouched, setColorTouched] = useState(false);
  const [date, setDate] = useState(defaultDate);

  const defaultSubjectCode = subjects[0]?.code ?? UNLINKED_SUBJECT_VALUE;
  const activeSubjectCode = subjectCode || defaultSubjectCode;
  const isUnlinked = activeSubjectCode === UNLINKED_SUBJECT_VALUE;
  const subject = subjects.find((item) => item.code === activeSubjectCode);

  useEffect(() => {
    if (!subjectCode && subjects.length > 0) {
      setSubjectCode(defaultSubjectCode);
    }
  }, [subjectCode, subjects, defaultSubjectCode]);

  const previewColor = useMemo(() => {
    if (colorTouched && color) return color;
    if (!isUnlinked && subject) return subject.color;
    return DEFAULT_EVENT_COLOR;
  }, [color, colorTouched, isUnlinked, subject]);

  const subjectOptions = useMemo(
    () => [
      ...subjects.map((item) => ({
        value: item.code,
        label: `${item.code} — ${item.name}`,
      })),
      { value: UNLINKED_SUBJECT_VALUE, label: "Não associado à matéria" },
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

    const resolvedColor =
      colorTouched && color ? color : !isUnlinked && subject ? subject.color : "";

    onSubmit({
      title: title.trim(),
      description:
        description.trim() ||
        (isUnlinked
          ? "Evento pessoal adicionado manualmente."
          : "Tarefa adicionada manualmente."),
      type,
      date,
      subject: isUnlinked ? undefined : subject?.name,
      subjectCode: isUnlinked ? undefined : activeSubjectCode,
      color: resolvedColor || DEFAULT_EVENT_COLOR,
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
          {isUnlinked
            ? "Cor automática se você não personalizar."
            : "Usando a cor da matéria. Toque na bolinha para outra cor neste evento."}
        </p>
      </div>
      <Input
        label="Data"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        disabled={isSubmitting}
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
