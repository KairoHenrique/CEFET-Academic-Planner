import { useMemo } from "react";
import { CourseMapPeriodColumn } from "@/components/mapa/CourseMapPeriodColumn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type {
  CourseMapPeriod,
  CourseMapStatus,
} from "@/lib/types/mapa-api";

const STATUS_BADGE: Record<CourseMapStatus, string> = {
  done: "success",
  current: "info",
  unlocked: "gold",
  locked: "danger",
};

const PERIODS_ROW_ONE = [1, 2, 3, 4, 5] as const;
const PERIODS_ROW_TWO = [6, 7, 8, 9, 10] as const;

interface CourseMapGridProps {
  periods: CourseMapPeriod[];
  statusLabels: Record<CourseMapStatus, string>;
}

function buildRegularPeriodMap(periods: CourseMapPeriod[]) {
  const regularByNumber = new Map<number, CourseMapPeriod>();

  for (const period of periods) {
    if (period.period >= 1) {
      regularByNumber.set(period.period, period);
    }
  }

  return regularByNumber;
}

function emptyPeriod(period: number): CourseMapPeriod {
  return { period, subjects: [] };
}

interface CourseMapPeriodRowProps {
  periodNumbers: readonly number[];
  regularByNumber: Map<number, CourseMapPeriod>;
  statusLabels: Record<CourseMapStatus, string>;
  rowLabel: string;
}

function CourseMapPeriodRow({
  periodNumbers,
  regularByNumber,
  statusLabels,
  rowLabel,
}: CourseMapPeriodRowProps) {
  return (
    <div className="course-map-row" role="row" aria-label={rowLabel}>
      {periodNumbers.map((periodNumber) => (
        <CourseMapPeriodColumn
          key={periodNumber}
          period={regularByNumber.get(periodNumber) ?? emptyPeriod(periodNumber)}
          statusLabels={statusLabels}
        />
      ))}
    </div>
  );
}

export function CourseMapGrid({ periods, statusLabels }: CourseMapGridProps) {
  const statusOrder = Object.keys(statusLabels) as CourseMapStatus[];
  const regularByNumber = useMemo(
    () => buildRegularPeriodMap(periods),
    [periods]
  );

  return (
    <div className="card">
      <SectionHeader title="Grade Curricular" icon="map" />

      <div
        className="course-map-legend"
        role="list"
        aria-label="Legenda de status"
      >
        {statusOrder.map((status) => (
          <span key={status} className="course-legend-item" role="listitem">
            <span className={`badge ${STATUS_BADGE[status]}`}>
              {statusLabels[status]}
            </span>
          </span>
        ))}
      </div>

      <div className="course-map-layout" role="table" aria-label="Grade por período">
        <CourseMapPeriodRow
          periodNumbers={PERIODS_ROW_ONE}
          regularByNumber={regularByNumber}
          statusLabels={statusLabels}
          rowLabel="Períodos 1 a 5"
        />
        <CourseMapPeriodRow
          periodNumbers={PERIODS_ROW_TWO}
          regularByNumber={regularByNumber}
          statusLabels={statusLabels}
          rowLabel="Períodos 6 a 10"
        />
      </div>
    </div>
  );
}
