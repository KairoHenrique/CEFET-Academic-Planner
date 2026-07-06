"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { SimuladorSimulationSummary } from "@/lib/types/simulador-api";

interface EnrollmentSimulacoesMenuProps {
  items: SimuladorSimulationSummary[];
  loading: boolean;
  deleting: boolean;
  disabled?: boolean;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatSavedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EnrollmentSimulacoesMenu({
  items,
  loading,
  deleting,
  disabled = false,
  onLoad,
  onDelete,
}: EnrollmentSimulacoesMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const isDisabled = disabled || deleting;

  return (
    <div
      ref={rootRef}
      className={[
        "enrollment-simulacoes-menu",
        open ? "is-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="enrollment-download-btn"
        onClick={() => setOpen((value) => !value)}
        disabled={isDisabled}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Carregar simulação salva"
      >
        <Icon name="clipboard" size={14} aria-hidden />
        Carregar
        <Icon name="chevron-down" size={12} aria-hidden />
      </button>

      {open ? (
        <div className="enrollment-simulacoes-popover" role="menu">
          {loading ? (
            <p className="enrollment-simulacoes-empty" role="status">
              Carregando…
            </p>
          ) : items.length === 0 ? (
            <p className="enrollment-simulacoes-empty" role="status">
              Nenhuma simulação salva ainda.
            </p>
          ) : (
            <ul className="enrollment-simulacoes-list">
              {items.map((item) => (
                <li key={item.id} className="enrollment-simulacoes-item">
                  <button
                    type="button"
                    className="enrollment-simulacoes-load"
                    role="menuitem"
                    onClick={() => {
                      onLoad(item.id);
                      setOpen(false);
                    }}
                  >
                    <span className="enrollment-simulacoes-load-title">
                      {item.titulo}
                    </span>
                    <span className="enrollment-simulacoes-load-meta">
                      {item.turmaCount}{" "}
                      {item.turmaCount === 1 ? "turma" : "turmas"} ·{" "}
                      {item.totalCh}h · {formatSavedAt(item.updatedAt)}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="enrollment-simulacoes-delete"
                    onClick={() => onDelete(item.id)}
                    disabled={deleting}
                    aria-label={`Excluir simulação ${item.titulo}`}
                  >
                    <Icon name="close" size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
