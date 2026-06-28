"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { CH_TYPES } from "@/lib/integralizacao/ch-catalog";
import type { ChType } from "@/lib/integralizacao/ch-catalog";
import type { PostIntegralizacaoBody } from "@/lib/types/integralizacao-api";
import { ApiClientError } from "@/lib/api/client";

interface RegisterHoursModalProps {
  open: boolean;
  onClose: () => void;
  isSaving?: boolean;
  onSubmit: (body: PostIntegralizacaoBody) => Promise<unknown>;
}

export function RegisterHoursModal({
  open,
  onClose,
  isSaving = false,
  onSubmit,
}: RegisterHoursModalProps) {
  const [tipoCh, setTipoCh] = useState<ChType>("Complementar");
  const [horasValue, setHorasValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTipoCh("Complementar");
      setHorasValue("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const horas = Number.parseInt(horasValue, 10);
    if (!Number.isInteger(horas) || horas <= 0) {
      setError("Informe um número inteiro de horas maior que zero.");
      return;
    }

    try {
      await onSubmit({ tipoCh, horas });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof ApiClientError
          ? submitError.message
          : "Não foi possível cadastrar as horas."
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cadastrar horas">
      <form className="modal-form-stack" onSubmit={(event) => void handleSubmit(event)}>
        <label className="form-field" htmlFor="register-hours-category">
          <span className="form-label">Categoria</span>
          <select
            id="register-hours-category"
            className="form-input form-select"
            value={tipoCh}
            disabled={isSaving}
            onChange={(event) => setTipoCh(event.target.value as ChType)}
          >
            {CH_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <span className="form-hint">
            Use Complementar para certificados, workshops ou disciplinas de outro
            curso reconhecidas.
          </span>
        </label>

        <Input
          label="Horas"
          type="number"
          min={1}
          max={999}
          step={1}
          inputMode="numeric"
          value={horasValue}
          disabled={isSaving}
          error={error ?? undefined}
          onChange={(event) => setHorasValue(event.target.value)}
          hint="Quantidade de horas a somar nesta categoria."
        />

        <div className="modal-form-actions">
          <button type="submit" className="btn-gold" disabled={isSaving}>
            {isSaving ? "Salvando…" : "Cadastrar"}
          </button>
          <button
            type="button"
            className="btn-outline"
            disabled={isSaving}
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}
