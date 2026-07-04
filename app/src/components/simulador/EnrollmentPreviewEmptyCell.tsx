"use client";

import {
  buildPreviewCellBorderColor,
  buildPreviewCellSplitGradient,
} from "@/lib/simulador/enrollment-multi-variant-preview";

interface EnrollmentPreviewEmptyCellProps {
  day: string;
  time: string;
  previewColors: readonly string[];
  isTarget: boolean;
  isForbidden: boolean;
  interactive: boolean;
  onActivate: (clickOffsetX: number, elementWidth: number) => void;
}

export function EnrollmentPreviewEmptyCell({
  day,
  time,
  previewColors,
  isTarget,
  isForbidden,
  interactive,
  onActivate,
}: EnrollmentPreviewEmptyCellProps) {
  const isSplit = previewColors.length > 1;

  return (
    <button
      type="button"
      className={[
        "schedule-slot-empty",
        "schedule-slot-empty-btn",
        "schedule-slot-variant-preview",
        isSplit ? "schedule-slot-variant-preview--split" : "",
        isTarget ? "schedule-slot-target" : "",
        isForbidden ? "schedule-slot-forbidden" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          background: buildPreviewCellSplitGradient(previewColors),
          borderColor: buildPreviewCellBorderColor(previewColors),
          ...(previewColors.length === 1
            ? { "--preview-color": previewColors[0] }
            : {}),
        } as React.CSSProperties
      }
      disabled={isForbidden}
      onClick={(event) => {
        if (!interactive || isForbidden) return;
        const rect = event.currentTarget.getBoundingClientRect();
        onActivate(event.clientX - rect.left, rect.width);
      }}
      aria-label={`Horário vazio ${day} ${time}`}
    />
  );
}
