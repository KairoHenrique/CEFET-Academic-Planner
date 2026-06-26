"use client";

import { useState } from "react";
import {
  SUBJECT_DISPLAY_GRADE_MAX,
  gradeValueColorClass,
} from "@/lib/disciplinas/grade-display";
import { RecoveryGradeEntry } from "@/components/grades/RecoveryGradeEntry";
import type { GradeRisk, GradeRiskZone } from "@/lib/types/grade-risk";

function gradeBadgeClass(zone: GradeRiskZone): string {
  if (zone === "safe") return "success";
  if (zone === "warning") return "warning";
  if (zone === "danger") return "danger";
  return "info";
}

function getBarMetrics(gradeRisk: GradeRisk, scaleMax: number) {
  const gradeBarWidth =
    scaleMax > 0
      ? Math.min(100, (gradeRisk.currentTotal / scaleMax) * 100)
      : 0;
  const passingMarkLeft =
    scaleMax > 0
      ? Math.min(100, (gradeRisk.passingGrade / scaleMax) * 100)
      : 60;

  return { gradeBarWidth, passingMarkLeft };
}

interface GradeRiskBarProps {
  gradeRisk: GradeRisk;
  scaleMax: number;
  className?: string;
  size?: "default" | "sm" | "panel";
}

export function GradeRiskBar({
  gradeRisk,
  scaleMax,
  className = "",
  size = "default",
}: GradeRiskBarProps) {
  const { gradeBarWidth, passingMarkLeft } = getBarMetrics(
    gradeRisk,
    scaleMax
  );

  const bar = (
    <div
      className={`progress-bar progress-bar--grade ${size === "panel" ? "progress-bar--grade-panel" : ""} ${size === "sm" ? "progress-bar--grade-sm" : ""} ${className}`.trim()}
      role="progressbar"
      aria-valuenow={Math.round(gradeBarWidth)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Nota atual: ${gradeRisk.currentTotal} de ${scaleMax} pts`}
    >
      <div
        className={`progress-bar-fill progress-bar-fill--grade progress-bar-fill--grade-${gradeRisk.zone}`}
        style={{ width: `${gradeBarWidth}%` }}
      />
      <div
        className="progress-bar-passing-mark-wrap"
        style={{ left: `${passingMarkLeft}%` }}
      >
        <div
          className="progress-bar-passing-mark"
          title={`Aprovação: ${gradeRisk.passingGrade} pts`}
        />
      </div>
    </div>
  );

  if (size !== "panel") {
    return bar;
  }

  return (
    <div className="grade-bar-panel-wrap">
      <div className="grade-bar-panel-labels" aria-hidden="true">
        <span
          className="grade-bar-passing-label"
          style={{ left: `${passingMarkLeft}%` }}
        >
          {gradeRisk.passingGrade}
        </span>
      </div>
      {bar}
    </div>
  );
}

interface GradeRiskIndicatorProps {
  grade: number | null;
  gradeMax?: number;
  gradeRisk: GradeRisk;
  variant?: "card" | "inline" | "panel";
  showBar?: boolean;
  showHint?: boolean;
  recoveryInteractive?: boolean;
  recoveryScore?: number | null;
  onRecoveryScoreSave?: (score: number) => void;
  onRecoveryScoreClear?: () => void;
}

function GradeStatBody({
  label,
  scoreValue,
  gradeMax,
  valueClass,
  badgeLabel,
  badgeZone,
}: {
  label: string;
  scoreValue: number | null;
  gradeMax: number;
  valueClass: string;
  badgeLabel: string;
  badgeZone: GradeRiskZone;
}) {
  const badgeClass = `badge subject-stat-badge ${gradeBadgeClass(badgeZone)}`;

  return (
    <>
      <span className="subject-stat-label">{label}</span>
      <div className={`subject-stat-value ${valueClass}`.trim()}>
        {scoreValue !== null ? (
          <>
            <span>{scoreValue}</span>
            <span className="subject-stat-max"> / {gradeMax}</span>
          </>
        ) : (
          <span className="subject-stat-max">— / {gradeMax}</span>
        )}
      </div>
      <span className={badgeClass}>{badgeLabel}</span>
    </>
  );
}

export function GradeRiskIndicator({
  grade,
  gradeMax = SUBJECT_DISPLAY_GRADE_MAX,
  gradeRisk,
  variant = "card",
  showBar = true,
  showHint = variant === "panel",
  recoveryInteractive = false,
  recoveryScore = null,
  onRecoveryScoreSave,
  onRecoveryScoreClear,
}: GradeRiskIndicatorProps) {
  const canEditRecovery =
    recoveryInteractive &&
    gradeRisk.fullyDistributed &&
    gradeRisk.currentTotal >= 40 &&
    gradeRisk.currentTotal < gradeRisk.passingGrade;

  const showRecoveryEntry =
    canEditRecovery &&
    onRecoveryScoreSave &&
    (gradeRisk.label === "Recuperação" || gradeRisk.label === "Reprovado");

  const recoveryHint =
    gradeRisk.recoveryAverage !== undefined
      ? `Média final: ${gradeRisk.recoveryAverage}`
      : gradeRisk.recoveryScoreNeeded !== undefined && canEditRecovery
        ? `Precisa ≥ ${gradeRisk.recoveryScoreNeeded} na recuperação`
        : null;

  if (gradeRisk.zone === "unknown") {
    if (variant === "inline") {
      return <span className="subject-stat-max">— / {gradeMax}</span>;
    }

    if (variant === "card") {
      return (
        <div className="grade-risk-card-block subject-stat-stack">
          <GradeStatBody
            label="Nota"
            scoreValue={null}
            gradeMax={gradeMax}
            valueClass=""
            badgeLabel="Sem notas"
            badgeZone="unknown"
          />
        </div>
      );
    }

    return null;
  }

  const scoreValue =
    grade !== null ? grade : gradeRisk.currentTotal > 0 ? gradeRisk.currentTotal : null;
  const valueClass = gradeValueColorClass(gradeRisk.label);

  const statusBlock = showRecoveryEntry ? (
    <RecoveryGradeEntry
      semesterTotal={gradeRisk.currentTotal}
      passingGrade={gradeRisk.passingGrade}
      recoveryScore={recoveryScore}
      onSave={onRecoveryScoreSave}
      onClear={onRecoveryScoreClear}
      compact={variant === "inline"}
    />
  ) : (
    <GradeStatBody
      label="Nota"
      scoreValue={scoreValue}
      gradeMax={gradeMax}
      valueClass={valueClass}
      badgeLabel={gradeRisk.label}
      badgeZone={gradeRisk.zone}
    />
  );

  const scoreHeader = showRecoveryEntry ? (
    <>
      <span className="subject-stat-label">Nota</span>
      <div className={`subject-stat-value ${valueClass}`.trim()}>
        <span>{scoreValue}</span>
        <span className="subject-stat-max"> / {gradeMax}</span>
      </div>
      {statusBlock}
    </>
  ) : (
    statusBlock
  );

  if (variant === "inline") {
    return (
      <div className="grade-risk-inline subject-stat-stack">
        {scoreHeader}
        {recoveryHint && !showRecoveryEntry && (
          <p className="subject-stat-hint subject-stat-hint--warning">
            {recoveryHint}
          </p>
        )}
        {showBar && (
          <GradeRiskBar gradeRisk={gradeRisk} scaleMax={gradeMax} size="sm" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`${variant === "panel" ? "grade-risk-panel" : "grade-risk-card-block"} subject-stat-stack`}
    >
      {scoreHeader}
      {recoveryHint && !showRecoveryEntry && (
        <p className={`subject-stat-hint subject-stat-hint--${gradeRisk.zone}`}>
          {recoveryHint}
        </p>
      )}
      {showHint && gradeRisk.pointsNeeded > 0 && !gradeRisk.fullyDistributed && (
        <p className={`subject-stat-hint subject-stat-hint--${gradeRisk.zone}`}>
          Faltam{" "}
          {gradeRisk.pointsNeeded % 1 === 0
            ? gradeRisk.pointsNeeded
            : gradeRisk.pointsNeeded.toFixed(1)}{" "}
          pts p/ {gradeRisk.passingGrade}
        </p>
      )}
      {showBar && (
        <GradeRiskBar
          gradeRisk={gradeRisk}
          scaleMax={gradeMax}
          size={variant === "panel" ? "panel" : "default"}
        />
      )}
    </div>
  );
}

export { gradeBadgeClass };
