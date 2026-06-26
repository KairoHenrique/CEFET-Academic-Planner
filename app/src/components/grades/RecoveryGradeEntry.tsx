"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useDismissiblePopup } from "@/hooks/useDismissiblePopup";
import { requiredRecoveryScore } from "@/lib/disciplinas/recovery";

interface RecoveryGradeEntryProps {
  semesterTotal: number;
  passingGrade: number;
  recoveryScore?: number | null;
  onSave: (score: number) => void;
  onClear?: () => void;
  compact?: boolean;
}

function parseRecoveryDraft(value: string): number | null {
  const parsed = parseFloat(value.replace(",", "."));
  if (Number.isNaN(parsed)) return null;
  return Math.min(100, Math.max(0, parsed));
}

export function RecoveryGradeEntry({
  semesterTotal,
  passingGrade,
  recoveryScore = null,
  onSave,
  onClear,
  compact = false,
}: RecoveryGradeEntryProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const needed = requiredRecoveryScore(semesterTotal, passingGrade);
  const hasScore = recoveryScore !== null && recoveryScore !== undefined;
  const parsedDraft = parseRecoveryDraft(draft);
  const canSave = parsedDraft !== null;

  useDismissiblePopup(open, () => setOpen(false), rootRef);

  useEffect(() => {
    if (!open) return;

    setDraft(hasScore ? String(recoveryScore) : "");
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, hasScore, recoveryScore]);

  const handleSave = () => {
    const parsed = parseRecoveryDraft(draft);
    if (parsed === null) return;
    onSave(parsed);
    setOpen(false);
  };

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <div
      ref={rootRef}
      className={`recovery-entry ${compact ? "recovery-entry--compact" : ""} ${open ? "recovery-entry--open" : ""} ${!hasScore ? "recovery-entry--pending" : ""}`.trim()}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {!open && (
        <p className="recovery-entry-callout" role="tooltip">
          {hasScore ? (
            <>Clique em <strong>Recuperação</strong> para alterar sua nota</>
          ) : (
            <>Clique em <strong>Recuperação</strong> para informar sua nota</>
          )}
        </p>
      )}

      <button
        type="button"
        className="recovery-entry-trigger"
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls={`${inputId}-panel`}
        aria-label="Recuperação. Clique para informar sua nota na prova."
      >
        <span className="badge warning subject-stat-badge recovery-entry-badge">
          Recuperação
        </span>
        <Icon
          name="help-circle"
          size={15}
          className="recovery-entry-help"
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={`${inputId}-panel`}
          className="recovery-entry-panel"
          role="region"
          aria-label="Nota da recuperação"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <p className="recovery-entry-panel-title">Nota da recuperação</p>
          <p className="recovery-entry-formula">
            Média = (semestre + recuperação) ÷ 2 · precisa ser ≥{" "}
            <strong>{passingGrade}</strong>
          </p>
          <p className="recovery-entry-panel-hint">
            Semestre: <strong>{semesterTotal}</strong> pts
          </p>
          <label className="recovery-entry-input-label" htmlFor={inputId}>
            Sua nota na prova
          </label>
          <div className="recovery-entry-input-row">
            <input
              ref={inputRef}
              id={inputId}
              className="recovery-entry-input"
              type="text"
              inputMode="decimal"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canSave) handleSave();
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder={String(needed)}
            />
            <span className="recovery-entry-suffix">/ 100</span>
            <button
              type="button"
              className="btn-gold recovery-entry-save"
              onClick={handleSave}
              disabled={!canSave}
            >
              OK
            </button>
          </div>
          <p className="recovery-entry-minimum">
            Mínimo para passar: <strong>{needed}</strong> pts
          </p>
          {onClear && hasScore && (
            <button
              type="button"
              className="recovery-entry-clear"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              Limpar nota informada
            </button>
          )}
        </div>
      )}
    </div>
  );
}
