"use client";

import { useEffect, useState } from "react";
import type { CalendarEvent } from "@/lib/types/calendar";
import { DEFAULT_EVENT_COLOR } from "@/lib/colors/palette";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { Input } from "@/components/ui/Input";
import { PlannerSelect } from "@/components/ui/PlannerSelect";
import { ColorPickerField } from "@/components/ui/ColorPickerField";

type LinkMode = "personal" | "subject";

interface AddEventFormProps {
  defaultDate: string;
  isSubmitting?: boolean;
  onSubmit: (event: Omit<CalendarEvent, "id" | "manual">) => void;
  onCancel: () => void;
}

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
  const [linkMode, setLinkMode] = useState<LinkMode>("personal");
  const [subjectCode, setSubjectCode] = useState("");
  const [color, setColor] = useState(DEFAULT_EVENT_COLOR);
  const [colorTouched, setColorTouched] = useState(false);
  const [date, setDate] = useState(defaultDate);

  useEffect(() => {
    if (!subjectCode && subjects[0]?.code) {
      setSubjectCode(subjects[0].code);
    }
  }, [subjectCode, subjects]);

  const subject = subjects.find((item) => item.code === subjectCode);

  useEffect(() => {
    if (linkMode === "subject" && subject && !colorTouched) {
      setColor(subject.color);
    }
  }, [linkMode, subject, colorTouched]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || isSubmitting) return;
    if (linkMode === "subject" && !subjectCode) return;

    onSubmit({
      title: title.trim(),
      description:
        description.trim() ||
        (linkMode === "personal"
          ? "Evento pessoal adicionado manualmente."
          : "Tarefa adicionada manualmente."),
      type,
      date,
      subject: linkMode === "subject" ? subject?.name : undefined,
      subjectCode: linkMode === "subject" ? subjectCode : undefined,
      color,
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
        label="Vínculo"
        value={linkMode}
        fullWidth
        options={[
          { value: "personal", label: "Pessoal — sem matéria" },
          { value: "subject", label: "Vinculado a uma disciplina" },
        ]}
        onChange={(next) => setLinkMode(next as LinkMode)}
      />
      {linkMode === "subject" && (
        <PlannerSelect
          label="Disciplina"
          value={subjectCode}
          fullWidth
          options={subjects.map((item) => ({
            value: item.code,
            label: `${item.code} — ${item.name}`,
          }))}
          onChange={setSubjectCode}
        />
      )}
      <PlannerSelect
        label="Tipo"
        value={type}
        fullWidth
        options={[
          { value: "tarefa", label: "Tarefa" },
          { value: "prova", label: "Prova" },
          { value: "evento", label: "Evento" },
          { value: "aula", label: "Aula" },
        ]}
        onChange={(next) => setType(next)}
      />
      <ColorPickerField
        label="Cor no calendário"
        value={color}
        onChange={(next) => {
          setColorTouched(true);
          setColor(next);
        }}
        disabled={isSubmitting}
      />
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
            linkMode === "personal"
              ? "Estágio, projeto pessoal, lembrete…"
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
