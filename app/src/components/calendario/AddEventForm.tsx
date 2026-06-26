"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/config/mock/calendar";
import { semesterSubjects } from "@/config/mock/subjects";
import { Input } from "@/components/ui/Input";
import { PlannerSelect } from "@/components/ui/PlannerSelect";

interface AddEventFormProps {
  defaultDate: string;
  onSubmit: (event: Omit<CalendarEvent, "id" | "manual">) => void;
  onCancel: () => void;
}

export function AddEventForm({ defaultDate, onSubmit, onCancel }: AddEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("tarefa");
  const [subjectCode, setSubjectCode] = useState(semesterSubjects[0]?.code ?? "");
  const [date, setDate] = useState(defaultDate);

  const subject = semesterSubjects.find((s) => s.code === subjectCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || "Tarefa adicionada manualmente.",
      type,
      date,
      subject: subject?.name,
      subjectCode: subject?.code,
      color: subject?.color ?? "#D4A843",
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
      />
      <PlannerSelect
        label="Disciplina"
        value={subjectCode}
        fullWidth
        options={semesterSubjects.map((s) => ({
          value: s.code,
          label: `${s.code} — ${s.name}`,
        }))}
        onChange={setSubjectCode}
      />
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
      <Input
        label="Data"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <label className="form-field">
        <span className="form-label">Descrição</span>
        <textarea
          className="form-input form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="O que precisa ser feito?"
        />
      </label>
      <div className="detail-actions">
        <button type="submit" className="btn-gold">Salvar tarefa</button>
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
