"use client";

import { useState } from "react";
import Link from "next/link";
import { WeeklyScheduleTable } from "@/components/schedule/WeeklyScheduleTable";
import { ScheduleTableSkeleton } from "@/components/schedule/ScheduleTableSkeleton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { PlannerSelect } from "@/components/ui/PlannerSelect";
import { Icon } from "@/components/ui/Icon";
import {
  getExtraTypeLabel,
  useScheduleExtras,
  type ExtraSlotType,
} from "@/hooks/useScheduleExtras";
import { weekDays, timeSlots } from "@/config/mock/schedule";

export function EditableSchedulePanel() {
  const schedule = useScheduleExtras();
  const [editMode, setEditMode] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{
    dayIdx: number;
    slotIdx: number;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [room, setRoom] = useState("");
  const [extraType, setExtraType] = useState<ExtraSlotType>("estudo");

  const handleSaveExtra = () => {
    if (!pendingSlot || !title.trim()) return;
    schedule.addExtra(pendingSlot.dayIdx, pendingSlot.slotIdx, {
      code: "EXTRA",
      name: title.trim(),
      room: room.trim() || "—",
      color: "#A371F7",
      extraType,
    });
    setPendingSlot(null);
    setTitle("");
    setRoom("");
  };

  if (schedule.loading) {
    return (
      <>
        <div className="schedule-editor-bar">
          <SectionHeader title="Grade Semanal" icon="calendar" />
        </div>
        <ScheduleTableSkeleton />
      </>
    );
  }

  if (schedule.needsSync) {
    return (
      <section className="schedule-panel-state card" aria-live="polite">
        <SectionHeader title="Grade Semanal" icon="calendar" />
        <p className="schedule-preview-message">
          Sincronize com o SIGAA para montar a grade com seus horários oficiais.
        </p>
        <Link href="/login" className="btn-gold schedule-preview-action">
          Ir para login
        </Link>
      </section>
    );
  }

  if (schedule.error) {
    return (
      <section
        className="schedule-panel-state card schedule-preview-state-error"
        role="alert"
      >
        <SectionHeader title="Grade Semanal" icon="calendar" />
        <p className="schedule-preview-message">{schedule.error}</p>
        <button
          type="button"
          className="btn-gold schedule-preview-action"
          onClick={() => void schedule.refetch()}
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  if (!schedule.hydrated) return null;

  return (
    <>
      <div className="schedule-editor-bar">
        <SectionHeader title="Grade Semanal" icon="calendar" />
        <button
          type="button"
          className={`btn-outline ${editMode ? "active" : ""}`}
          onClick={() => setEditMode((v) => !v)}
        >
          <Icon name="plus" size={14} />
          {editMode ? "Concluir edição" : "Editar grade"}
        </button>
      </div>

      {editMode && (
        <p className="schedule-editor-hint">
          Clique em um horário vazio para adicionar monitoria, estágio ou estudo.
        </p>
      )}

      <WeeklyScheduleTable
        schedule={schedule.mergedSchedule}
        interactive
        onEmptyClick={
          editMode
            ? (dayIdx, slotIdx) => setPendingSlot({ dayIdx, slotIdx })
            : undefined
        }
        highlightEmpty={editMode}
      />

      <Modal
        open={Boolean(pendingSlot)}
        onClose={() => setPendingSlot(null)}
        title="Adicionar atividade extra"
      >
        {pendingSlot && (
          <>
            <p className="detail-date">
              {weekDays[pendingSlot.dayIdx]} · {timeSlots[pendingSlot.slotIdx]}
            </p>
            <Input
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Monitoria de Cálculo"
            />
            <Input
              label="Local"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Sala ou online"
            />
            <PlannerSelect
              label="Tipo"
              value={extraType}
              fullWidth
              options={[
                { value: "monitoria", label: "Monitoria" },
                { value: "estagio", label: "Estágio" },
                { value: "estudo", label: "Estudo" },
                { value: "outro", label: "Outro" },
              ]}
              onChange={(next) => setExtraType(next)}
            />
            <p className="panel-footer-note">
              Será salvo como: {getExtraTypeLabel(extraType)}
            </p>
            <div className="detail-actions">
              <button type="button" className="btn-gold" onClick={handleSaveExtra}>
                Adicionar
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setPendingSlot(null)}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
