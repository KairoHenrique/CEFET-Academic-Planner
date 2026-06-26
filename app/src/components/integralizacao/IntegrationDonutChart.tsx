"use client";

import { useId } from "react";

const DONUT_RADIUS = 52;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_CENTER = 60;

interface IntegrationDonutChartProps {
  percentage: number;
  totalDone: number;
  totalHours: number;
}

export function IntegrationDonutChart({
  percentage,
  totalDone,
  totalHours,
}: IntegrationDonutChartProps) {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, "");
  const gradientId = `donut-grad-${safeId}`;
  const progress = Math.min(100, Math.max(0, percentage));
  const dashOffset = DONUT_CIRCUMFERENCE * (1 - progress / 100);
  const remaining = Math.max(0, totalHours - totalDone);

  return (
    <div className="integration-donut-wrap">
      <div
        className="integration-donut"
        role="img"
        aria-label={`${progress}% da formação concluída, ${totalDone} de ${totalHours} horas`}
      >
        <svg
          viewBox="0 0 120 120"
          className="integration-donut-svg integration-donut-svg-rings"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--gold-600)" />
              <stop offset="42%" stopColor="var(--gold-400)" />
              <stop offset="100%" stopColor="var(--gold-200)" />
            </linearGradient>
          </defs>
          <circle
            className="integration-donut-track"
            cx={DONUT_CENTER}
            cy={DONUT_CENTER}
            r={DONUT_RADIUS}
          />
          <circle
            className="integration-donut-fill-glow"
            cx={DONUT_CENTER}
            cy={DONUT_CENTER}
            r={DONUT_RADIUS}
            stroke={`url(#${gradientId})`}
            strokeDasharray={DONUT_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
          <circle
            className="integration-donut-fill"
            cx={DONUT_CENTER}
            cy={DONUT_CENTER}
            r={DONUT_RADIUS}
            stroke={`url(#${gradientId})`}
            strokeDasharray={DONUT_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>

        <div className="integration-donut-center" aria-hidden>
          <div className="integration-donut-center-group">
            <span className="integration-donut-value">{progress}%</span>
            <span className="integration-donut-label">concluído</span>
          </div>
        </div>
      </div>

      <div className="integration-donut-footer">
        <p className="integration-donut-hours">
          <strong>{totalDone}h</strong> de {totalHours}h
        </p>
        <p className="integration-donut-remaining">{remaining}h restantes</p>
      </div>
    </div>
  );
}
