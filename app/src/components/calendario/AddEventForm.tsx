"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/config/mock/calendar";
import { semesterSubjects } from "@/config/mock/subjects";
import { Input } from "@/components/ui/Input";

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
      <label className="form-field">
        <span className="form-label">Disciplina</span>
        <select
          className="form-input"
          value={subjectCode}
          onChange={(e) => setSubjectCode(e.target.value)}
        >
          {semesterSubjects.map((s) => (
            <option key={s.code} value={s.code}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span className="form-label">Tipo</span>
        <select
          className="form-input"
          value={type}
          onChange={(e) => setType(e.target.value as CalendarEvent["type"])}
        >
          <option value="tarefa">Tarefa</option>
          <option value="prova">Prova</option>
          <option value="evento">Evento</option>
          <option value="aula">Aula</option>
        </select>
      </label>
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
