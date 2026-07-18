"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

interface SubjectPanelsRowProps {
  gradesPanel: ReactNode;
  absencePanel: ReactNode;
}

export function SubjectPanelsRow({
  gradesPanel,
  absencePanel,
}: SubjectPanelsRowProps) {
  const gradesColRef = useRef<HTMLDivElement>(null);
  const [syncedHeightPx, setSyncedHeightPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const gradesColumn = gradesColRef.current;
    if (!gradesColumn) return;

    const mobileQuery = window.matchMedia("(max-width: 768px)");

    const resolveGradesPanel = (): HTMLElement | null => {
      const panel = gradesColumn.querySelector(".grades-panel");
      return panel instanceof HTMLElement ? panel : null;
    };

    const syncHeightFromGrades = () => {
      if (mobileQuery.matches) {
        setSyncedHeightPx(null);
        return;
      }
      const panel = resolveGradesPanel();
      if (!panel) return;
      setSyncedHeightPx(Math.round(panel.getBoundingClientRect().height));
    };

    syncHeightFromGrades();

    const panel = resolveGradesPanel();
    if (!panel) return;

    const observer = new ResizeObserver(syncHeightFromGrades);
    observer.observe(panel);
    mobileQuery.addEventListener("change", syncHeightFromGrades);
    return () => {
      observer.disconnect();
      mobileQuery.removeEventListener("change", syncHeightFromGrades);
    };
  }, []);

  const rowStyle =
    syncedHeightPx !== null
      ? ({
          ["--subject-panel-sync-height" as string]: `${syncedHeightPx}px`,
        } as CSSProperties)
      : undefined;

  return (
    <div className="col-12 subject-panels-row" style={rowStyle}>
      <div className="subject-panel-col subject-panel-col--grades" ref={gradesColRef}>
        {gradesPanel}
      </div>
      <div className="subject-panel-col subject-panel-col--synced">{absencePanel}</div>
    </div>
  );
}
