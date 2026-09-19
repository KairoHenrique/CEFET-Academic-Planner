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

const ATTENDANCE_SCROLL_AFTER_ROWS = 4;

function blockHeight(el: HTMLElement): number {
  const style = getComputedStyle(el);
  return (
    el.getBoundingClientRect().height +
    parseFloat(style.marginTop) +
    parseFloat(style.marginBottom)
  );
}

function childrenBlockHeight(
  el: HTMLElement,
  skip: Element | null = null
): number {
  const style = getComputedStyle(el);
  let height = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  for (const child of el.children) {
    if (child === skip || !(child instanceof HTMLElement)) continue;
    height += blockHeight(child);
  }
  return height;
}

function attendanceTableFloorPx(tableWrap: HTMLElement): number {
  const table = tableWrap.querySelector("table");
  const head =
    table instanceof HTMLElement ? table.querySelector("thead") : null;
  const row =
    table instanceof HTMLElement ? table.querySelector("tbody tr") : null;
  const headH =
    head instanceof HTMLElement ? head.getBoundingClientRect().height : 0;
  const rowH =
    row instanceof HTMLElement ? row.getBoundingClientRect().height : 0;

  if (headH > 0 && rowH > 0) {
    return Math.round(headH + ATTENDANCE_SCROLL_AFTER_ROWS * rowH);
  }

  const fallback = getComputedStyle(tableWrap).minHeight;
  const parsed = Number.parseFloat(fallback);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.round(parsed)
    : Math.round(tableWrap.scrollHeight);
}

export function SubjectPanelsRow({
  gradesPanel,
  absencePanel,
}: SubjectPanelsRowProps) {
  const gradesColRef = useRef<HTMLDivElement>(null);
  const absenceColRef = useRef<HTMLDivElement>(null);
  const [syncedHeightPx, setSyncedHeightPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const gradesColumn = gradesColRef.current;
    const absenceColumn = absenceColRef.current;
    if (!gradesColumn || !absenceColumn) return;

    const mobileQuery = window.matchMedia("(max-width: 768px)");

    const resolvePanel = (
      column: HTMLElement,
      selector: string
    ): HTMLElement | null => {
      const panel = column.querySelector(selector);
      return panel instanceof HTMLElement ? panel : null;
    };

    const syncHeights = () => {
      if (mobileQuery.matches) {
        setSyncedHeightPx(null);
        return;
      }

      const gradesPanelEl = resolvePanel(gradesColumn, ".grades-panel");
      const absencePanelEl = resolvePanel(absenceColumn, ".absence-panel");
      if (!gradesPanelEl || !absencePanelEl) return;

      const tableWrap = absencePanelEl.querySelector(".attendance-table-wrap");
      const tableWrapEl =
        tableWrap instanceof HTMLElement ? tableWrap : null;

      const gradesNatural = childrenBlockHeight(gradesPanelEl);
      const absenceChrome = childrenBlockHeight(absencePanelEl, tableWrapEl);
      const tableMargin = tableWrapEl
        ? parseFloat(getComputedStyle(tableWrapEl).marginTop) +
          parseFloat(getComputedStyle(tableWrapEl).marginBottom)
        : 0;
      const tableFloor = tableWrapEl
        ? attendanceTableFloorPx(tableWrapEl)
        : 0;
      const absenceMin = absenceChrome + tableMargin + tableFloor;
      const next = Math.round(Math.max(gradesNatural, absenceMin));

      setSyncedHeightPx((prev) => (prev === next ? prev : next));
    };

    syncHeights();

    const gradesPanelEl = resolvePanel(gradesColumn, ".grades-panel");
    const absencePanelEl = resolvePanel(absenceColumn, ".absence-panel");
    if (!gradesPanelEl || !absencePanelEl) return;

    const observer = new ResizeObserver(syncHeights);
    observer.observe(gradesPanelEl);
    observer.observe(absencePanelEl);
    mobileQuery.addEventListener("change", syncHeights);
    return () => {
      observer.disconnect();
      mobileQuery.removeEventListener("change", syncHeights);
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
      <div
        className="subject-panel-col subject-panel-col--grades"
        ref={gradesColRef}
      >
        {gradesPanel}
      </div>
      <div
        className="subject-panel-col subject-panel-col--absence subject-panel-col--synced"
        ref={absenceColRef}
      >
        {absencePanel}
      </div>
    </div>
  );
}
