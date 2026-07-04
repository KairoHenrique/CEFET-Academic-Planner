"use client";

import { brand } from "@/config/brand";

interface EnrollmentScheduleExportBannerProps {
  semestreLabel?: string | null;
}

export function EnrollmentScheduleExportBanner({
  semestreLabel,
}: EnrollmentScheduleExportBannerProps) {
  const semestre = semestreLabel?.trim() || "—";
  const title = `Grade Simulada - ${semestre}`;

  return (
    <header
      className="enrollment-schedule-export-banner"
      aria-label={title}
    >
      <div className="enrollment-schedule-export-brand">
        {brand.logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- captura precisa de <img> nativo
          <img
            src={brand.logoSrc}
            alt=""
            className="enrollment-schedule-export-logo"
            width={48}
            height={48}
            loading="eager"
            decoding="sync"
          />
        ) : (
          <span className="brand-logo" role="img" aria-hidden="true">
            {brand.logoEmoji}
          </span>
        )}
        <span className="enrollment-schedule-export-brand-name" aria-hidden="true">
          {brand.name.split(" ").map((word) => (
            <span key={word} className="enrollment-schedule-export-brand-word">
              {word}
            </span>
          ))}
        </span>
      </div>

      <h3 className="enrollment-schedule-export-heading">
        Grade Simulada -{" "}
        <span className="enrollment-schedule-export-semestre">{semestre}</span>
      </h3>
    </header>
  );
}
