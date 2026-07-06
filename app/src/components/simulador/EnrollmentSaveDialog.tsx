"use client";

import { useEffect, useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";

interface EnrollmentSaveDialogProps {
  open: boolean;
  defaultTitle: string;
  saving: boolean;
  onClose: () => void;
  onSave: (titulo: string) => void;
}

export function EnrollmentSaveDialog({
  open,
  defaultTitle,
  saving,
  onClose,
  onSave,
}: EnrollmentSaveDialogProps) {
  const inputId = useId();
  const [titulo, setTitulo] = useState(defaultTitle);

  useEffect(() => {
    if (open) setTitulo(defaultTitle);
  }, [open, defaultTitle]);

  const trimmed = titulo.trim();
  const canSave = trimmed.length > 0 && !saving;

  return (
    <Modal open={open} onClose={onClose} title="Salvar simulação">
      <form
        className="modal-form-stack enrollment-save-dialog"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSave) return;
          onSave(trimmed);
        }}
      >
        <p className="modal-hint">
          Dê um nome para recuperar esta grade depois ou na hora da matrícula.
        </p>

        <label className="modal-form-field" htmlFor={inputId}>
          <span className="form-label">Título</span>
          <input
            id={inputId}
            type="text"
            className="form-input"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Ex.: Plano 2026.1 — manhã"
            maxLength={120}
            autoComplete="off"
            disabled={saving}
          />
        </label>

        <div className="modal-form-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-gold" disabled={!canSave}>
            <Icon name="check" size={14} aria-hidden />
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
