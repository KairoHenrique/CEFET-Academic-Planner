"use client";

import { Icon } from "@/components/ui/Icon";
import type { SimuladorChoquePair } from "@/lib/types/simulador-api";

interface EnrollmentScheduleConflictBannerProps {
  conflicts: readonly SimuladorChoquePair[];
  checking: boolean;
}

export function EnrollmentScheduleConflictBanner({
  conflicts,
  checking,
}: EnrollmentScheduleConflictBannerProps) {
  if (conflicts.length === 0 && !checking) return null;

  const count = conflicts.length;
  const headline =
    count === 1
      ? "1 choque de horário na grade"
      : `${count} choques de horário na grade`;

  return (
    <div
      className="enrollment-schedule-conflict-banner"
      role="status"
      aria-live="polite"
    >
      <Icon name="priority-high" size={16} aria-hidden />
      <div className="enrollment-schedule-conflict-banner-copy">
        <p className="enrollment-schedule-conflict-banner-title">
          {checking && count === 0 ? "Verificando choques…" : headline}
        </p>
        {count > 0 ? (
          <p className="enrollment-schedule-conflict-banner-hint">
            Células em vermelho indicam sobreposição. Ajuste turmas ou remova
            disciplinas conflitantes.
          </p>
        ) : null}
      </div>
    </div>
  );
}
