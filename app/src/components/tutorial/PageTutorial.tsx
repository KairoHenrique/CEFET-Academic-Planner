"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import {
  getPageTutorialSteps,
  type PageTutorialId,
  type PageTutorialVariant,
} from "@/components/tutorial/page-tutorial-steps";

const MOBILE_QUERY = "(max-width: 768px)";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface PageTutorialProps {
  tutorialId: PageTutorialId;
  open: boolean;
  onClose: () => void;
}

function resolveTutorialVariant(): PageTutorialVariant {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia(MOBILE_QUERY).matches ? "mobile" : "desktop";
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

export function PageTutorial({ tutorialId, open, onClose }: PageTutorialProps) {
  const [variant, setVariant] = useState<PageTutorialVariant>("desktop");
  const steps = getPageTutorialSteps(tutorialId, { variant });
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

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
    setVariant(resolveTutorialVariant());

    const media = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setVariant(media.matches ? "mobile" : "desktop");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setSpotlight(null);
      return;
    }

    setStepIndex(0);
    setVariant(resolveTutorialVariant());
  }, [open, tutorialId]);

  useEffect(() => {
    if (!open) return;

    refreshSpotlight();
    const onLayoutChange = () => refreshSpotlight();
    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("scroll", onLayoutChange, true);
    return () => {
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("scroll", onLayoutChange, true);
    };
  }, [open, stepIndex, variant, refreshSpotlight]);

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
      aria-label="Tutorial da página"
      data-tutorial-variant={variant}
    >
      <div className="site-tutorial-backdrop" onClick={onClose} aria-hidden="true" />

      {spotlight && (
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
        <p className="site-tutorial-step-count">
          {stepIndex + 1} / {steps.length}
          <span className="site-tutorial-variant-label">
            {variant === "mobile" ? " · celular" : " · desktop"}
          </span>
        </p>
        <h2 className="site-tutorial-title">{step.title}</h2>
        <p className="site-tutorial-body">{step.body}</p>

        <div className="site-tutorial-actions">
          <button type="button" className="btn-outline btn-sm" onClick={onClose}>
            Fechar
          </button>
          <div className="site-tutorial-nav">
            {!isFirst && (
              <button
                type="button"
                className="btn-outline btn-sm"
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
                onClick={() => setStepIndex((value) => value + 1)}
              >
                Próximo
                <Icon name="chevron-right" size={14} />
              </button>
            ) : (
              <button type="button" className="btn-gold btn-sm" onClick={onClose}>
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
