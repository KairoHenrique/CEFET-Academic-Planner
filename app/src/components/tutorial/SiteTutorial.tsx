"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import {
  resolveTutorialRoute,
  SITE_TUTORIAL_STEPS,
} from "@/components/tutorial/site-tutorial-steps";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SiteTutorialProps {
  open: boolean;
  onClose: () => void;
}

function findTargetRect(targetId: string | null): SpotlightRect | null {
  if (!targetId) return null;
  const element = document.querySelector<HTMLElement>(
    `[data-tutorial-id="${targetId}"]`
  );
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const padding = 6;

  return {
    top: Math.max(8, rect.top - padding),
    left: Math.max(8, rect.left - padding),
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

export function SiteTutorial({ open, onClose }: SiteTutorialProps) {
  const router = useRouter();
  const cachedDisciplineCode = useRef<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [routeReady, setRouteReady] = useState(true);

  const step = SITE_TUTORIAL_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === SITE_TUTORIAL_STEPS.length - 1;

  const refreshSpotlight = useCallback(() => {
    if (!open || !step) {
      setSpotlight(null);
      return;
    }

    if (!step.targetId) {
      setSpotlight(null);
      return;
    }

    const target = document.querySelector<HTMLElement>(
      `[data-tutorial-id="${step.targetId}"]`
    );
    target?.scrollIntoView({ block: "center", inline: "nearest" });
    setSpotlight(findTargetRect(step.targetId));
  }, [open, step]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !step) return;

    const row = document.querySelector<HTMLElement>(
      '[data-tutorial-id="tutorial-discipline-row"]'
    );
    if (row?.dataset.disciplineCode?.trim()) {
      cachedDisciplineCode.current = row.dataset.disciplineCode.trim();
    }

    const path = resolveTutorialRoute(step.route, cachedDisciplineCode.current);
    if (!path) {
      setRouteReady(true);
      return;
    }

    setRouteReady(false);
    router.push(path);

    const timer = window.setTimeout(() => {
      setRouteReady(true);
    }, 550);

    return () => window.clearTimeout(timer);
  }, [open, stepIndex, step, router]);

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setSpotlight(null);
      setRouteReady(true);
      cachedDisciplineCode.current = null;
      return;
    }

    if (!routeReady) return;

    refreshSpotlight();
    const onLayoutChange = () => refreshSpotlight();
    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("scroll", onLayoutChange, true);
    return () => {
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("scroll", onLayoutChange, true);
    };
  }, [open, stepIndex, routeReady, refreshSpotlight]);

  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  if (!open || !mounted || !step) return null;

  const tooltipClass = spotlight
    ? "site-tutorial-tooltip site-tutorial-tooltip--anchored"
    : "site-tutorial-tooltip site-tutorial-tooltip--center";

  return createPortal(
    <div
      className="site-tutorial-root"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial do site"
    >
      <div className="site-tutorial-backdrop" onClick={onClose} aria-hidden="true" />

      {spotlight && routeReady && (
        <div
          className="site-tutorial-spotlight"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
          aria-hidden="true"
        />
      )}

      <div className={tooltipClass}>
        {!routeReady ? (
          <p className="site-tutorial-body">Carregando página…</p>
        ) : (
          <>
            <p className="site-tutorial-step-count">
              {stepIndex + 1} / {SITE_TUTORIAL_STEPS.length}
            </p>
            <h2 className="site-tutorial-title">{step.title}</h2>
            <p className="site-tutorial-body">{step.body}</p>
          </>
        )}

        <div className="site-tutorial-actions">
          <button type="button" className="btn-outline btn-sm" onClick={onClose}>
            Pular
          </button>
          <div className="site-tutorial-nav">
            {!isFirst && (
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={!routeReady}
                onClick={() => setStepIndex((value) => value - 1)}
              >
                <Icon name="chevron-left" size={14} />
                Anterior
              </button>
            )}
            {!isLast ? (
              <button
                type="button"
                className="btn-gold btn-sm"
                disabled={!routeReady}
                onClick={() => setStepIndex((value) => value + 1)}
              >
                Próximo
                <Icon name="chevron-right" size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="btn-gold btn-sm"
                disabled={!routeReady}
                onClick={onClose}
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
