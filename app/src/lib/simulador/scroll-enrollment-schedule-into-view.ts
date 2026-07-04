const SCHEDULE_PANEL_SELECTOR = '[data-tutorial-id="tutorial-enrollment-schedule"]';

/** Centraliza a grade simulada na viewport (scroll suave). */
export function scrollEnrollmentScheduleIntoView(): void {
  if (typeof window === "undefined") return;

  const target = document.querySelector<HTMLElement>(SCHEDULE_PANEL_SELECTOR);
  if (!target) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "center",
    inline: "nearest",
  });
}
