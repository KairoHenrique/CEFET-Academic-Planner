"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SubjectApelido } from "@/components/simulador/SubjectApelido";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

const EXIT_MS = 260;

interface EnrollmentSelectionFloatProps {
  selectedCourse: TurmaOfertadaCourse;
  selectedShortLabel: string;
  selectedHorario: string | null;
  onDismiss: () => void;
}

export function EnrollmentSelectionFloat({
  selectedCourse,
  selectedShortLabel,
  selectedHorario,
  onDismiss,
}: EnrollmentSelectionFloatProps) {
  const [phase, setPhase] = useState<"enter" | "idle" | "exit">("enter");
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPhase("enter");
    const idleTimer = setTimeout(() => setPhase("idle"), 520);
    return () => clearTimeout(idleTimer);
  }, [selectedCourse.turmaSigaaId]);

  useEffect(
    () => () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    },
    []
  );

  const handleDismiss = useCallback(() => {
    if (phase === "exit") return;

    setPhase("exit");
    exitTimerRef.current = setTimeout(() => {
      onDismiss();
    }, EXIT_MS);
  }, [onDismiss, phase]);

  return (
    <div className="enrollment-selection-float-shell">
      <aside
        className={[
          "enrollment-selection-float",
          phase === "enter" ? "is-entering" : "",
          phase === "idle" ? "is-idle" : "",
          phase === "exit" ? "is-exiting" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="status"
        aria-live="polite"
        aria-label={`Turma selecionada: ${selectedShortLabel}, ${selectedCourse.name}`}
      >
        <span
          className="enrollment-selection-float-accent"
          aria-hidden
          style={{ backgroundColor: selectedCourse.color }}
        />

        <button
          type="button"
          className="enrollment-selection-float-close"
          onClick={handleDismiss}
          aria-label="Desmarcar turma selecionada"
        >
          <Icon name="close" size={14} aria-hidden />
        </button>

        <div className="enrollment-selection-float-body">
          <div className="enrollment-selection-float-head enrollment-selection-float-item">
            <span className="enrollment-selection-float-badge">
              <span className="enrollment-selection-float-badge-dot" aria-hidden />
              <Icon name="map" size={12} aria-hidden />
              Alocando
            </span>
          </div>

          <div className="enrollment-selection-float-item">
            <SubjectApelido label={selectedShortLabel} />
          </div>
          <p className="enrollment-selection-float-name enrollment-selection-float-item">
            {selectedCourse.name}
          </p>
          {selectedHorario ? (
            <p className="enrollment-selection-float-schedule enrollment-selection-float-item">
              {selectedHorario}
            </p>
          ) : (
            <p className="enrollment-selection-float-schedule enrollment-selection-float-schedule--muted enrollment-selection-float-item">
              Horário não informado
            </p>
          )}
          <p className="enrollment-selection-float-hint enrollment-selection-float-item">
            Clique em uma célula destacada na grade
          </p>
        </div>
      </aside>
    </div>
  );
}
