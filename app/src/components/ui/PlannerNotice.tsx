"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";

const DEFAULT_AUTO_DISMISS_MS = 4800;
const EXIT_MS = 220;
const ENTER_MS = 320;

export interface PlannerNoticeProps {
  open: boolean;
  message: string | null;
  onDismiss: () => void;
  kicker?: string;
  /** Altere para repetir a animação ao exibir nova mensagem. */
  noticeKey?: number | string;
  autoDismissMs?: number;
}

export function PlannerNotice({
  open,
  message,
  onDismiss,
  kicker = "Atenção",
  noticeKey = 0,
  autoDismissMs = DEFAULT_AUTO_DISMISS_MS,
}: PlannerNoticeProps) {
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
    if (!open || !message) return undefined;

    clearTimers();
    setPhase("enter");

    const enterTimer = setTimeout(() => setPhase("idle"), ENTER_MS);
    const autoTimer = setTimeout(dismiss, autoDismissMs);
    timersRef.current.push(enterTimer, autoTimer);

    return clearTimers;
  }, [autoDismissMs, clearTimers, dismiss, message, noticeKey, open]);

  if (!open || !message || typeof document === "undefined") return null;

  return createPortal(
    <div className="enrollment-conflict-notice-shell">
      <aside
        className={[
          "enrollment-conflict-notice",
          "planner-notice",
          phase === "enter" ? "is-entering" : "",
          phase === "idle" ? "is-idle" : "",
          phase === "exit" ? "is-exiting" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="alert"
        aria-live="assertive"
        style={{ ["--conflict-notice-duration" as string]: `${autoDismissMs}ms` }}
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
          aria-label="Fechar aviso"
        >
          <Icon name="close" size={12} aria-hidden />
        </button>

        <p className="enrollment-conflict-notice-kicker">{kicker}</p>
        <p className="planner-notice-message">{message}</p>
      </aside>
    </div>,
    document.body
  );
}
