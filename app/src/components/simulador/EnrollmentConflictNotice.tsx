"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { SubjectApelido } from "@/components/simulador/SubjectApelido";
import type { EnrollmentScheduleConflictNotice } from "@/lib/simulador/enrollment-schedule-conflict-notice";

const AUTO_DISMISS_MS = 4800;
const EXIT_MS = 220;
const ENTER_MS = 320;

interface ConflictNoticeSubjectProps {
  shortLabel: string;
  name: string;
}

function ConflictNoticeSubject({ shortLabel, name }: ConflictNoticeSubjectProps) {
  return (
    <span className="enrollment-conflict-notice-subject">
      <SubjectApelido label={shortLabel} />
      <span className="enrollment-conflict-notice-subject-sep" aria-hidden="true">
        ·
      </span>
      <span className="enrollment-conflict-notice-subject-name">{name}</span>
    </span>
  );
}

interface EnrollmentConflictNoticeProps {
  notice: EnrollmentScheduleConflictNotice;
  onDismiss: () => void;
}

export function EnrollmentConflictNotice({
  notice,
  onDismiss,
}: EnrollmentConflictNoticeProps) {
  const [phase, setPhase] = useState<"enter" | "idle" | "exit">("enter");
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) clearTimeout(timer);
    timersRef.current = [];
  }, []);

  const dismiss = useCallback(() => {
    setPhase((current) => {
      if (current === "exit") return current;
      const timer = setTimeout(onDismiss, EXIT_MS);
      timersRef.current.push(timer);
      return "exit";
    });
  }, [onDismiss]);

  useEffect(() => {
    clearTimers();
    setPhase("enter");

    const enterTimer = setTimeout(() => setPhase("idle"), ENTER_MS);
    const autoTimer = setTimeout(dismiss, AUTO_DISMISS_MS);
    timersRef.current.push(enterTimer, autoTimer);

    return clearTimers;
  }, [clearTimers, dismiss, notice]);

  const primaryConflict = notice.conflicts[0];

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="enrollment-conflict-notice-shell">
      <aside
        className={[
          "enrollment-conflict-notice",
          phase === "enter" ? "is-entering" : "",
          phase === "idle" ? "is-idle" : "",
          phase === "exit" ? "is-exiting" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="alert"
        aria-live="assertive"
        style={{ ["--conflict-notice-duration" as string]: `${AUTO_DISMISS_MS}ms` }}
      >
        <div className="enrollment-conflict-notice-progress" aria-hidden="true">
          <span
            className={[
              "enrollment-conflict-notice-progress-bar",
              phase === "exit" ? "is-paused" : "is-running",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        </div>

        <button
          type="button"
          className="enrollment-conflict-notice-close"
          onClick={dismiss}
          aria-label="Fechar aviso de conflito"
        >
          <Icon name="close" size={12} aria-hidden />
        </button>

        <p className="enrollment-conflict-notice-kicker">Conflito de horário</p>

        <div className="enrollment-conflict-notice-selected">
          <ConflictNoticeSubject
            shortLabel={notice.selectedShortLabel}
            name={notice.selectedName}
          />
        </div>

        {notice.kind === "partner" && notice.partnerShortLabel ? (
          <p className="enrollment-conflict-notice-partner">
            Coreq. trancada:{" "}
            <ConflictNoticeSubject
              shortLabel={notice.partnerShortLabel}
              name={notice.partnerName ?? ""}
            />
          </p>
        ) : null}

        {primaryConflict ? (
          <div className="enrollment-conflict-notice-block">
            <p className="enrollment-conflict-notice-block-label">
              Conflito com{" "}
              <ConflictNoticeSubject
                shortLabel={primaryConflict.shortLabel}
                name={primaryConflict.name}
              />
            </p>
            <p className="enrollment-conflict-notice-block-time">
              {primaryConflict.horario}
            </p>
          </div>
        ) : null}
      </aside>
    </div>,
    document.body
  );
}
