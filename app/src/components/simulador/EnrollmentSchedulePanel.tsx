"use client";

import { useCallback, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { WeeklyScheduleTable } from "@/components/schedule/WeeklyScheduleTable";
import { EnrollmentScheduleExportBanner } from "@/components/simulador/EnrollmentScheduleExportBanner";
import { EnrollmentScheduleExportCards } from "@/components/simulador/EnrollmentScheduleExportCards";
import {
  downloadElementAsJpeg,
} from "@/lib/export/download-element-jpeg";
import type { ScheduleSlot, ScheduleSlotData } from "@/lib/types/schedule";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

interface EnrollmentSchedulePanelProps {
  schedule: ScheduleSlot[][];
  catalog: TurmaOfertadaCourse[];
  placedCount: number;
  obrigatoriasCh: number;
  optativasCh: number;
  totalCh: number;
  semestreLabel?: string | null;
  highlightEmpty: boolean;
  allowedEmptyCells: Set<string> | null;
  previewCellLayers?: ReadonlyMap<string, readonly string[]> | null;
  onSlotClick: (payload: {
    slot: ScheduleSlotData;
    day: string;
    time: string;
    dayIdx: number;
    slotIdx: number;
  }) => void;
  onEmptyClick: (
    dayIdx: number,
    slotIdx: number,
    clickMeta?: { clickOffsetX: number; elementWidth: number }
  ) => void;
  onClearSchedule: () => void;
}

export function EnrollmentSchedulePanel({
  schedule,
  catalog,
  placedCount,
  obrigatoriasCh,
  optativasCh,
  totalCh,
  semestreLabel,
  highlightEmpty,
  allowedEmptyCells,
  previewCellLayers = null,
  onSlotClick,
  onEmptyClick,
  onClearSchedule,
}: EnrollmentSchedulePanelProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const canClear = placedCount > 0;
  const canDownload = placedCount > 0;

  const handleDownload = useCallback(async () => {
    const target = captureRef.current;
    if (!target || exporting || !canDownload) return;

    setExporting(true);
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      await downloadElementAsJpeg(target, semestreLabel);
    } catch (error) {
      console.error("[enrollment] falha ao exportar grade simulada", error);
    } finally {
      setExporting(false);
    }
  }, [canDownload, exporting, semestreLabel]);

  return (
    <section
      className={[
        "enrollment-schedule-panel",
        exporting ? "enrollment-schedule-panel--exporting" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Grade simulada"
      data-tutorial-id="tutorial-enrollment-schedule"
    >
      <div ref={captureRef} className="enrollment-schedule-capture">
        <EnrollmentScheduleExportBanner semestreLabel={semestreLabel} />

        <header className="enrollment-schedule-head">
          <div className="enrollment-schedule-head-main">
            <h4 className="enrollment-subtitle">Grade simulada</h4>
            <div className="enrollment-schedule-stats">
              <span className="enrollment-stat-pill">
                <Icon name="books" size={12} aria-hidden />
                {placedCount}{" "}
                {placedCount === 1 ? "disciplina" : "disciplinas"}
              </span>
              {placedCount > 0 ? (
                <span
                  className="enrollment-stat-pill enrollment-stat-pill--ch"
                  title={`Obrigatórias: ${obrigatoriasCh}h · Optativas: ${optativasCh}h · Total: ${totalCh}h`}
                >
                  <Icon name="chart" size={12} aria-hidden />
                  <span>Obr. {obrigatoriasCh}h</span>
                  <span className="enrollment-stat-sep" aria-hidden>
                    ·
                  </span>
                  <span>Opt. {optativasCh}h</span>
                  <span className="enrollment-stat-sep" aria-hidden>
                    ·
                  </span>
                  <span>Total {totalCh}h</span>
                </span>
              ) : null}
            </div>
          </div>
          <div className="enrollment-schedule-head-spacer" aria-hidden="true" />
        </header>

        <div className="enrollment-schedule">
          <WeeklyScheduleTable
            schedule={schedule}
            compact
            simulated
            interactive={!exporting}
            highlightEmpty={highlightEmpty && !exporting}
            allowedEmptyCells={allowedEmptyCells}
            previewCellLayers={previewCellLayers}
            onSlotClick={onSlotClick}
            onEmptyClick={onEmptyClick}
          />
        </div>

        <EnrollmentScheduleExportCards schedule={schedule} catalog={catalog} />
      </div>

      <div className="enrollment-schedule-actions" data-export-exclude="true">
        <button
          type="button"
          className="enrollment-download-btn"
          onClick={() => void handleDownload()}
          disabled={!canDownload || exporting}
          aria-label="Baixar imagem da grade simulada em JPEG"
        >
          <Icon name="download" size={14} aria-hidden />
          {exporting ? "Gerando…" : "Baixar"}
        </button>
        <button
          type="button"
          className="enrollment-clear-btn"
          onClick={onClearSchedule}
          disabled={!canClear}
          aria-label="Limpar grade simulada"
        >
          <Icon name="close" size={14} aria-hidden />
          Limpar
        </button>
      </div>
    </section>
  );
}
